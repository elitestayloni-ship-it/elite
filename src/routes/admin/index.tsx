import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BedDouble,
  CheckCircle2,
  Clock3,
  Home as HomeIcon,
  ImagePlus,
  Inbox,
  LoaderCircle,
  LogOut,
  Mail,
  MessageSquare,
  PencilLine,
  Phone,
  Trash2,
  UserCheck,
} from "lucide-react";
import logoMark from "@/assets/logo-mark.png";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  GALLERY_IMAGE_BUCKET,
  buildGalleryImages,
  type GalleryAsset,
} from "@/lib/gallery-config";
import {
  buildRoomCards,
  getDefaultRoomCards,
  MAX_ROOM_IMAGES,
  ROOM_IMAGE_BUCKET,
  type RoomCard,
} from "@/lib/room-config";
import {
  buildHeroMedia,
  filterHomepageGalleryRows,
  getDefaultHeroMedia,
  pickHeroMediaRow,
  SITE_MEDIA_BUCKET,
  type SiteMediaAsset,
} from "@/lib/site-media-config";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Elite Stay" }] }),
  component: AdminDashboard,
});

type Enquiry = Tables<"enquiries">;
type RoomCategoryImageRow = Pick<Tables<"room_categories">, "slug" | "image_path" | "image_paths">;
type Banner = {
  tone: "success" | "error";
  message: string;
};
type DashboardPanel = "hero" | "rooms" | "gallery" | "enquiries";

function isHasRolePermissionError(message: string) {
  return message.toLowerCase().includes("permission denied for function has_role");
}

function formatDashboardErrorMessage(message: string) {
  if (isHasRolePermissionError(message)) {
    return "This Supabase project is missing the latest admin role grant. Apply the newest SQL migration, or run GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;, then sign in again.";
  }

  return message;
}

function isMissingImagePathsColumnError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("image_paths") && (normalized.includes("schema cache") || normalized.includes("column"));
}

async function loadRoomCategoryRows() {
  const roomResponse = await supabase.from("room_categories").select("slug, image_path, image_paths");

  if (!roomResponse.error) {
    return {
      rows: (roomResponse.data ?? []) as RoomCategoryImageRow[],
      supportsImagePathsColumn: true,
      errorMessage: null as string | null,
    };
  }

  if (!isMissingImagePathsColumnError(roomResponse.error.message)) {
    return {
      rows: null,
      supportsImagePathsColumn: true,
      errorMessage: roomResponse.error.message,
    };
  }

  const legacyRoomResponse = await supabase.from("room_categories").select("slug, image_path");

  if (legacyRoomResponse.error) {
    return {
      rows: null,
      supportsImagePathsColumn: false,
      errorMessage: legacyRoomResponse.error.message,
    };
  }

  const rows: RoomCategoryImageRow[] = (legacyRoomResponse.data ?? []).map((row) => ({
    ...row,
    image_paths: row.image_path ? [row.image_path] : [],
  }));

  return {
    rows,
    supportsImagePathsColumn: false,
    errorMessage: null as string | null,
  };
}

function getRoomSlotKey(slug: string, slotIndex: number) {
  return `${slug}:${slotIndex}`;
}

function AdminDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<DashboardPanel>("hero");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [heroMedia, setHeroMedia] = useState<SiteMediaAsset>(() => getDefaultHeroMedia());
  const [roomCards, setRoomCards] = useState<RoomCard[]>(() => getDefaultRoomCards());
  const [supportsImagePathsColumn, setSupportsImagePathsColumn] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryAsset[]>([]);
  const [screenError, setScreenError] = useState<string>("");
  const [heroBanner, setHeroBanner] = useState<Banner | null>(null);
  const [roomBanner, setRoomBanner] = useState<Banner | null>(null);
  const [galleryBanner, setGalleryBanner] = useState<Banner | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingRoomSlotKey, setUploadingRoomSlotKey] = useState<string | null>(null);
  const [deletingHero, setDeletingHero] = useState(false);
  const [deletingRoomSlotKey, setDeletingRoomSlotKey] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        nav({ to: "/admin/login" });
      }
    });

    const loadDashboard = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        nav({ to: "/admin/login" });
        return;
      }

      if (!active) {
        return;
      }

      setUserId(session.user.id);

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (rolesError) {
        if (active) {
          setScreenError(rolesError.message);
          setLoading(false);
        }
        return;
      }

      const admin = !!roles?.some((role) => role.role === "admin");

      if (!active) {
        return;
      }

      setIsAdmin(admin);

      if (!admin) {
        setLoading(false);
        return;
      }

      const [enquiryResponse, roomLoadResult, galleryResponse] = await Promise.all([
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
        loadRoomCategoryRows(),
        supabase
          .from("gallery_images")
          .select("id, image_path, alt_text, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (!active) {
        return;
      }

      if (enquiryResponse.error) {
        setScreenError(enquiryResponse.error.message);
      } else {
        setEnquiries(enquiryResponse.data ?? []);
      }

      setSupportsImagePathsColumn(roomLoadResult.supportsImagePathsColumn);

      if (roomLoadResult.errorMessage) {
        setRoomBanner({
          tone: "error",
          message: "Saved room images could not be loaded, so the default website images are being shown.",
        });
      } else if (!roomLoadResult.supportsImagePathsColumn) {
        setRoomBanner({
          tone: "error",
          message:
            "This Supabase project is still using the legacy room image schema. Slot 1 works, but slots 2-4 need the latest migration that adds room_categories.image_paths.",
        });
      }

      setRoomCards(
        buildRoomCards(roomLoadResult.rows, (imagePath) =>
          supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
        ),
      );

      if (galleryResponse.error) {
        setHeroBanner({
          tone: "error",
          message:
            "The hero image manager could not load its saved image, so the homepage is still using the default bundled hero photo.",
        });
        setGalleryBanner({
          tone: "error",
          message:
            "Custom gallery images could not be loaded. The public site will continue using the bundled website gallery images.",
        });
      } else {
        setHeroMedia(
          buildHeroMedia(pickHeroMediaRow(galleryResponse.data), (imagePath) =>
            supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
        setGalleryItems(
          buildGalleryImages(filterHomepageGalleryRows(galleryResponse.data), (imagePath) =>
            supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setEnquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const removeEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) {
      return;
    }

    const { error } = await supabase.from("enquiries").delete().eq("id", id);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setEnquiries((current) => current.filter((item) => item.id !== id));
  };

  const uploadHeroImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setHeroBanner({ tone: "error", message: "Please choose a valid image file." });
      return;
    }

    setUploadingHero(true);
    setHeroBanner(null);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileBaseName = normalizeFileBaseName(file.name, "hero-image");
    const filePath = `hero/${fileBaseName}-${Date.now()}.${extension}`;
    const altText = humanizeFileBaseName(fileBaseName) || "Elite Stay hero image";

    const { error: uploadError } = await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadingHero(false);
      setHeroBanner({ tone: "error", message: uploadError.message });
      return;
    }

    const { data: createdRow, error: insertError } = await supabase
      .from("gallery_images")
      .insert({ image_path: filePath, alt_text: altText })
      .select("id, image_path, alt_text, created_at")
      .single();

    if (insertError || !createdRow) {
      await supabase.storage.from(SITE_MEDIA_BUCKET).remove([filePath]);
      setUploadingHero(false);
      setHeroBanner({ tone: "error", message: insertError?.message ?? "Hero image could not be saved." });
      return;
    }

    let cleanupWarning = "";

    if (heroMedia.recordId) {
      const { error: deletePreviousRowError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", heroMedia.recordId);

      if (deletePreviousRowError) {
        cleanupWarning = ` The previous hero image record could not be cleaned up: ${deletePreviousRowError.message}`;
      }
    }

    if (heroMedia.imagePath) {
      const { error: deletePreviousStorageError } = await supabase.storage
        .from(SITE_MEDIA_BUCKET)
        .remove([heroMedia.imagePath]);

      if (!cleanupWarning && deletePreviousStorageError) {
        cleanupWarning = ` The previous hero image file could not be deleted: ${deletePreviousStorageError.message}`;
      }
    }

    setHeroMedia(
      buildHeroMedia(createdRow, (imagePath) =>
        supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(imagePath).data.publicUrl,
      ),
    );
    setUploadingHero(false);
    setHeroBanner({
      tone: cleanupWarning ? "error" : "success",
      message: `Hero image ${heroMedia.imagePath ? "updated" : "added"} successfully. The homepage banner will show the new image after refresh.${cleanupWarning}`,
    });
  };

  const deleteHeroImage = async () => {
    if (!heroMedia.imagePath) {
      return;
    }

    if (!confirm("Delete the custom hero image? The website will switch back to the default hero image.")) {
      return;
    }

    setDeletingHero(true);
    setHeroBanner(null);

    if (!heroMedia.recordId) {
      setDeletingHero(false);
      setHeroBanner({ tone: "error", message: "The saved hero image record could not be found." });
      return;
    }

    const imagePathToRemove = heroMedia.imagePath;
    const { error: deleteRowError } = await supabase.from("gallery_images").delete().eq("id", heroMedia.recordId);

    if (deleteRowError) {
      setDeletingHero(false);
      setHeroBanner({ tone: "error", message: deleteRowError.message });
      return;
    }

    const { error: removeStorageError } = await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .remove([imagePathToRemove]);

    setHeroMedia(getDefaultHeroMedia());
    setDeletingHero(false);

    if (removeStorageError) {
      setHeroBanner({
        tone: "error",
        message: `Hero image was reset to the default website image, but the old file could not be deleted from storage: ${removeStorageError.message}`,
      });
      return;
    }

    setHeroBanner({
      tone: "success",
      message: "Hero image deleted successfully. The homepage is now using the default hero image again.",
    });
  };

  const updateRoomCardImagePaths = (slug: RoomCard["slug"], imagePaths: string[]) => {
    const normalizedPaths = imagePaths.filter(Boolean).slice(0, MAX_ROOM_IMAGES);
    const customImages = normalizedPaths.map(
      (path) => supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
    );

    setRoomCards((current) =>
      current.map((item) => {
        if (item.slug !== slug) {
          return item;
        }

        const fallbackRoom = getDefaultRoomCards().find((fallback) => fallback.slug === slug);
        const fallbackImages = fallbackRoom?.images ?? item.images;
        const images = customImages.length > 0 ? customImages : fallbackImages;

        return {
          ...item,
          img: images[0] ?? item.img,
          images,
          imagePath: normalizedPaths[0] ?? null,
          imagePaths: normalizedPaths,
          customImages,
        };
      }),
    );
  };

  const uploadRoomImage = async (room: RoomCard, slotIndex: number, file: File) => {
    if (slotIndex < 0 || slotIndex >= MAX_ROOM_IMAGES) {
      setRoomBanner({ tone: "error", message: "Please choose a valid room image slot." });
      return;
    }

    if (!supportsImagePathsColumn && slotIndex > 0) {
      setRoomBanner({
        tone: "error",
        message:
          "Slots 2-4 need the latest Supabase migration. Right now this project can save only slot 1 (image_path).",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setRoomBanner({ tone: "error", message: "Please choose a valid image file." });
      return;
    }

    const slotKey = getRoomSlotKey(room.slug, slotIndex);
    setUploadingRoomSlotKey(slotKey);
    setRoomBanner(null);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileBaseName = normalizeFileBaseName(file.name, "room");
    const filePath = `${room.slug}/slot-${slotIndex + 1}-${fileBaseName}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(ROOM_IMAGE_BUCKET)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setUploadingRoomSlotKey(null);
      setRoomBanner({ tone: "error", message: uploadError.message });
      return;
    }

    const nextImagePaths = [...room.imagePaths];
    const replacedImagePath = nextImagePaths[slotIndex] ?? null;
    nextImagePaths[slotIndex] = filePath;
    const imagePathsForSave = nextImagePaths.filter(Boolean).slice(0, MAX_ROOM_IMAGES);

    const roomCategoryPayload = supportsImagePathsColumn
      ? {
          slug: room.slug,
          name: room.name,
          image_path: imagePathsForSave[0] ?? null,
          image_paths: imagePathsForSave,
        }
      : {
          slug: room.slug,
          name: room.name,
          image_path: imagePathsForSave[0] ?? null,
        };

    const { error: saveError } = await supabase
      .from("room_categories")
      .upsert(roomCategoryPayload, { onConflict: "slug" });

    if (saveError) {
      await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([filePath]);
      setUploadingRoomSlotKey(null);
      setRoomBanner({ tone: "error", message: saveError.message });
      return;
    }

    if (replacedImagePath && replacedImagePath !== filePath) {
      await supabase.storage.from(ROOM_IMAGE_BUCKET).remove([replacedImagePath]);
    }

    const savedImagePaths = supportsImagePathsColumn
      ? imagePathsForSave
      : imagePathsForSave[0]
        ? [imagePathsForSave[0]]
        : [];

    updateRoomCardImagePaths(room.slug, savedImagePaths);
    setUploadingRoomSlotKey(null);
    setRoomBanner({
      tone: "success",
      message: `${room.name} image ${replacedImagePath ? "updated" : "added"} in slot ${slotIndex + 1}.`,
    });
  };

  const deleteRoomImage = async (room: RoomCard, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= MAX_ROOM_IMAGES) {
      return;
    }

    if (!supportsImagePathsColumn && slotIndex > 0) {
      setRoomBanner({
        tone: "error",
        message:
          "Slots 2-4 need the latest Supabase migration. Right now this project can clear only slot 1.",
      });
      return;
    }

    const imagePathToRemove = room.imagePaths[slotIndex];

    if (!imagePathToRemove) {
      return;
    }

    if (!confirm(`Delete ${room.name} image in slot ${slotIndex + 1}?`)) {
      return;
    }

    const slotKey = getRoomSlotKey(room.slug, slotIndex);
    setDeletingRoomSlotKey(slotKey);
    setRoomBanner(null);

    const nextImagePaths = room.imagePaths.filter((_, index) => index !== slotIndex);

    const roomCategoryUpdate = supportsImagePathsColumn
      ? { image_path: nextImagePaths[0] ?? null, image_paths: nextImagePaths }
      : { image_path: nextImagePaths[0] ?? null };

    const { error: saveError } = await supabase
      .from("room_categories")
      .update(roomCategoryUpdate)
      .eq("slug", room.slug);

    if (saveError) {
      setDeletingRoomSlotKey(null);
      setRoomBanner({ tone: "error", message: saveError.message });
      return;
    }

    const { error: removeStorageError } = await supabase.storage
      .from(ROOM_IMAGE_BUCKET)
      .remove([imagePathToRemove]);

    const savedImagePaths = supportsImagePathsColumn
      ? nextImagePaths
      : nextImagePaths[0]
        ? [nextImagePaths[0]]
        : [];

    updateRoomCardImagePaths(room.slug, savedImagePaths);
    setDeletingRoomSlotKey(null);

    if (removeStorageError) {
      setRoomBanner({
        tone: "error",
        message: `${room.name} slot ${slotIndex + 1} was cleared, but the old file could not be deleted from storage: ${removeStorageError.message}`,
      });
      return;
    }

    setRoomBanner({
      tone: "success",
      message: `${room.name} image removed from slot ${slotIndex + 1}.`,
    });
  };

  const uploadGalleryImages = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setUploadingGallery(true);
    setGalleryBanner(null);

    const uploadedItems: GalleryAsset[] = [];

    for (const [index, file] of selectedFiles.entries()) {
      if (!file.type.startsWith("image/")) {
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: `Skipped "${file.name}" because it is not an image file.` });
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileBaseName = normalizeFileBaseName(file.name, "gallery-image");
      const filePath = `gallery/${fileBaseName}-${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_IMAGE_BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: uploadError.message });
        return;
      }

      const altText = humanizeFileBaseName(fileBaseName);
      const { data: createdRow, error: insertError } = await supabase
        .from("gallery_images")
        .insert({ image_path: filePath, alt_text: altText })
        .select("id, image_path, alt_text, created_at")
        .single();

      if (insertError || !createdRow) {
        await supabase.storage.from(GALLERY_IMAGE_BUCKET).remove([filePath]);
        setUploadingGallery(false);
        setGalleryBanner({ tone: "error", message: insertError?.message ?? "Gallery image could not be saved." });
        return;
      }

      uploadedItems.push(
        ...buildGalleryImages([createdRow], (imagePath) =>
          supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
        ),
      );
    }

    setGalleryItems((current) => [...uploadedItems.reverse(), ...current]);
    setUploadingGallery(false);
    setGalleryBanner({
      tone: "success",
      message:
        uploadedItems.length === 1
          ? "Gallery image uploaded successfully. It will appear in the moving About strip and the homepage gallery."
          : `${uploadedItems.length} gallery images uploaded successfully.`,
    });
  };

  const deleteGalleryImage = async (image: GalleryAsset) => {
    if (!image.imagePath) {
      return;
    }

    if (!confirm("Delete this gallery image?")) {
      return;
    }

    setDeletingGalleryId(image.id);
    setGalleryBanner(null);

    const { error: removeStorageError } = await supabase.storage
      .from(GALLERY_IMAGE_BUCKET)
      .remove([image.imagePath]);

    if (removeStorageError) {
      setDeletingGalleryId(null);
      setGalleryBanner({ tone: "error", message: removeStorageError.message });
      return;
    }

    const { error: deleteRowError } = await supabase.from("gallery_images").delete().eq("id", image.id);

    if (deleteRowError) {
      setDeletingGalleryId(null);
      setGalleryBanner({ tone: "error", message: deleteRowError.message });
      return;
    }

    setGalleryItems((current) => current.filter((item) => item.id !== image.id));
    setDeletingGalleryId(null);
    setGalleryBanner({
      tone: "success",
      message: "Gallery image deleted successfully.",
    });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
          <div className="mt-3 text-sm text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const hasRolePermissionIssue = isHasRolePermissionError(screenError);

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 p-6">
        <div className="w-full max-w-lg rounded-[2rem] surface-card p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold">Access pending</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This account is signed in, but it does not currently have the admin role for the
            Elite Stay dashboard.
          </p>

          {screenError && (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formatDashboardErrorMessage(screenError)}
            </div>
          )}

          {userId && (
            <div className="mt-5 rounded-2xl bg-muted px-4 py-4 text-left text-xs">
              <div className="mb-1 text-muted-foreground">Signed-in user ID</div>
              <code className="break-all">{userId}</code>
            </div>
          )}

          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            {hasRolePermissionIssue
              ? "This project needs the latest Supabase admin-role migration before any signed-in admin can open the dashboard. Apply the migration, then sign out and sign back in."
              : "If this is a new setup, sign out and create the first owner account from the admin login page. Otherwise, ask an existing admin to add this user to the user_roles table with the admin role."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/login"
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Back to login
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-[1.01]"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = enquiries.length;
  const fresh = enquiries.filter((item) => item.status === "new").length;
  const contacted = enquiries.filter((item) => item.status === "contacted").length;
  const closed = enquiries.filter((item) => item.status === "closed").length;
  const customHeroCount = heroMedia.isDefault ? 0 : 1;
  const dashboardTabs: Array<{
    count: number;
    icon: typeof ImagePlus;
    key: DashboardPanel;
    label: string;
  }> = [
    { key: "hero", label: "Hero Media", count: customHeroCount, icon: ImagePlus },
    { key: "rooms", label: "Rooms", count: roomCards.length, icon: BedDouble },
    { key: "gallery", label: "Gallery", count: galleryItems.length, icon: ImagePlus },
    { key: "enquiries", label: "Enquiries", count: total, icon: Inbox },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0d0f14_0%,#141821_18rem,#eef4f8_18rem,#eef4f8_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0f14]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logoMark}
              alt="Elite Stay"
              className="h-11 w-11 rounded-2xl object-contain shadow-[var(--shadow-soft)]"
              width={312}
              height={312}
            />
            <div>
              <div className="font-display font-bold text-white">Elite Stay Admin</div>
              <div className="text-xs text-white/55">Hero, rooms, gallery, and enquiries dashboard</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-2 text-sm text-white/84 transition hover:bg-white/8 hover:text-white"
            >
              <HomeIcon className="h-4 w-4" /> View site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-2 text-sm text-white/84 transition hover:bg-white/8 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,#101216_0%,#171a21_100%)] px-6 py-7 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-9">
          <div className="max-w-4xl">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/62">
                Control center
              </div>
              <h1 className="mt-4 font-sans text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                Admin Dashboard
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/64 sm:text-base">
                Hero: {customHeroCount} | Rooms: {roomCards.length} | Gallery: {galleryItems.length} | Enquiries: {total} | New: {fresh}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activePanel === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivePanel(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-transparent bg-[linear-gradient(135deg,#ff7a18_0%,#ff4d6d_100%)] text-white shadow-[0_18px_45px_rgba(255,92,83,0.28)]"
                      : "border-white/10 bg-white/4 text-white/82 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/18" : "bg-white/8 text-white/60"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activePanel === "hero" ? (
        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Homepage media
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Hero section image</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Add, replace, or delete the large banner image shown at the top of the homepage.
                This is the first image visitors see when they open the site.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              {heroMedia.isDefault ? "Using default hero image" : "Custom hero image live"}
            </div>
          </div>

          {heroBanner && <BannerCard banner={heroBanner} className="mt-5" />}

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[var(--shadow-soft)]">
              <div className="relative h-72 overflow-hidden sm:h-80">
                <img src={heroMedia.src} alt={heroMedia.alt} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#102033]/18 via-[#102033]/8 to-[#102033]/55" />
                <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">
                  {heroMedia.isDefault ? "Default image" : "Custom image"}
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-[1.15rem] border border-white/12 bg-black/45 px-4 py-3 text-sm text-white/88 backdrop-blur">
                  Hero section preview
                </div>
              </div>
            </article>

            <div className="rounded-[1.6rem] border border-border/70 bg-background p-5 shadow-[var(--shadow-soft)]">
              <div className="font-semibold">Homepage first impression</div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Use a wide, high-quality landscape photo for the cleanest hero banner result
                across desktop and mobile.
              </p>

              <div className="mt-5 space-y-4 rounded-[1.2rem] bg-muted/50 p-4 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Current source
                  </div>
                  <div className="mt-1 font-medium text-foreground">
                    {heroMedia.isDefault ? "Bundled website image" : "Custom admin upload"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Alt text
                  </div>
                  <div className="mt-1 text-foreground">{heroMedia.alt}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition ${
                    uploadingHero || deletingHero
                      ? "pointer-events-none opacity-60"
                      : "cursor-pointer hover:scale-[1.01]"
                  }`}
                >
                  {uploadingHero ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : heroMedia.imagePath ? (
                    <PencilLine className="h-4 w-4" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {uploadingHero ? "Saving..." : heroMedia.imagePath ? "Edit image" : "Add image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingHero || deletingHero}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadHeroImage(file);
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
                {heroMedia.imagePath ? (
                  <button
                    type="button"
                    onClick={() => void deleteHeroImage()}
                    disabled={uploadingHero || deletingHero}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-60"
                  >
                    {deletingHero ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deletingHero ? "Deleting..." : "Delete image"}
                  </button>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
                    No custom image yet
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Wide JPG, PNG, or WebP recommended
                </span>
              </div>
            </div>
          </div>
        </section>
        ) : null}

        {activePanel === "rooms" ? (
        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                 Content manager
               </div>
               <h2 className="mt-3 font-display text-2xl font-bold">Room image manager</h2>
               <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {supportsImagePathsColumn
                  ? `Add, replace, or delete up to ${MAX_ROOM_IMAGES} custom images for each room category below. The public room cards on the homepage will use these images automatically.`
                  : "This project is on the legacy room image schema, so only slot 1 is writable right now. Run the latest Supabase migration to unlock slots 2-4."}
               </p>
             </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              3 room categories
            </div>
          </div>

          {roomBanner && <BannerCard banner={roomBanner} className="mt-5" />}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {roomCards.map((room) => {
              const roomIsBusy =
                uploadingRoomSlotKey?.startsWith(`${room.slug}:`) ||
                deletingRoomSlotKey?.startsWith(`${room.slug}:`);

              return (
                <article
                  key={room.slug}
                  className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[var(--shadow-soft)]"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={room.img} alt={room.name} className="h-full w-full object-cover" />
                    <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">
                      {room.name}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{room.name}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {room.imagePaths.length > 0
                        ? `${room.imagePaths.length} custom room image${room.imagePaths.length === 1 ? "" : "s"} currently live.`
                        : "Default website image is being used right now."}
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-3">
                      {Array.from({ length: MAX_ROOM_IMAGES }).map((_, slotIndex) => {
                        const slotKey = getRoomSlotKey(room.slug, slotIndex);
                        const slotPath = room.imagePaths[slotIndex] ?? null;
                        const slotImage = room.customImages[slotIndex] ?? null;
                        const isUploading = uploadingRoomSlotKey === slotKey;
                        const isDeleting = deletingRoomSlotKey === slotKey;
                        const legacySchemaLock = !supportsImagePathsColumn && slotIndex > 0;
                        const slotIsBusy = isUploading || isDeleting || !!roomIsBusy || legacySchemaLock;

                        return (
                          <div
                            key={slotKey}
                            className="rounded-2xl border border-border/70 bg-muted/20 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-20 overflow-hidden rounded-xl border border-border/60 bg-muted">
                                {slotImage ? (
                                  <img
                                    src={slotImage}
                                    alt={`${room.name} room slot ${slotIndex + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[11px] text-muted-foreground">
                                    Empty
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                  Image slot {slotIndex + 1}
                                </div>
                                <div className="text-sm">
                                  {legacySchemaLock
                                    ? "Locked until image_paths migration"
                                    : slotPath
                                      ? "Custom image live"
                                      : "No image in this slot"}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label
                                className={`inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition ${
                                  slotIsBusy ? "pointer-events-none opacity-60" : "cursor-pointer hover:scale-[1.01]"
                                }`}
                              >
                                {isUploading ? (
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                ) : slotPath ? (
                                  <PencilLine className="h-3.5 w-3.5" />
                                ) : (
                                  <ImagePlus className="h-3.5 w-3.5" />
                                )}
                                {legacySchemaLock ? "Locked" : isUploading ? "Saving..." : slotPath ? "Replace" : "Add"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={slotIsBusy}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                      void uploadRoomImage(room, slotIndex, file);
                                    }
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => void deleteRoomImage(room, slotIndex)}
                                disabled={slotIsBusy || !slotPath}
                                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-60"
                              >
                                {isDeleting ? (
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <span className="mt-4 block text-xs text-muted-foreground">
                      {supportsImagePathsColumn
                        ? `Upload JPG, PNG, or WebP files. Maximum ${MAX_ROOM_IMAGES} images per room.`
                        : "Upload JPG, PNG, or WebP files. In legacy mode, only slot 1 can be saved."}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        ) : null}

        {activePanel === "gallery" ? (
        <section className="mt-8 rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Gallery manager
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Homepage gallery images</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Add extra gallery images here. These custom uploads appear in both the homepage
                gallery section and the auto-scrolling image strip inside the About section.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              {galleryItems.length} custom gallery image{galleryItems.length === 1 ? "" : "s"}
            </div>
          </div>

          {galleryBanner && <BannerCard banner={galleryBanner} className="mt-5" />}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition ${
                uploadingGallery ? "pointer-events-none opacity-60" : "cursor-pointer hover:scale-[1.01]"
              }`}
            >
              {uploadingGallery ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploadingGallery ? "Uploading..." : "Upload gallery images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void uploadGalleryImages(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-muted-foreground">You can select multiple images at once.</span>
          </div>

          {galleryItems.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              No custom gallery images uploaded yet. The website is currently showing its bundled
              default gallery images.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {galleryItems.map((image) => {
                const isDeleting = deletingGalleryId === image.id;

                return (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-background shadow-[var(--shadow-soft)]"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-start justify-between gap-3 p-5">
                      <div>
                        <div className="font-semibold">{image.alt}</div>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                          This image is live on the public homepage gallery.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteGalleryImage(image)}
                        disabled={isDeleting}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border transition hover:bg-destructive hover:text-destructive-foreground disabled:pointer-events-none disabled:opacity-60"
                      >
                        {isDeleting ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        ) : null}

        {activePanel === "enquiries" ? (
        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_24px_60px_rgba(15,85,125,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Leads
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold">Website enquiries</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Every enquiry submitted from the contact form appears here.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
              {total} total enquiries
            </div>
          </div>

          {screenError && <BannerCard banner={{ tone: "error", message: screenError }} className="m-6" />}

          {enquiries.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No enquiries yet.</div>
          ) : (
            <ul className="divide-y divide-border/70">
              {enquiries.map((enquiry) => (
                <li key={enquiry.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{enquiry.name}</h3>
                        <StatusPill status={enquiry.status} />
                        {enquiry.room_type && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {enquiry.room_type}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {enquiry.phone}
                        </span>
                        {enquiry.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {enquiry.email}
                          </span>
                        )}
                        <span className="text-xs">{new Date(enquiry.created_at).toLocaleString()}</span>
                      </div>
                      {enquiry.message && (
                        <p className="mt-3 flex gap-2 text-sm">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{enquiry.message}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={enquiry.status}
                        onChange={(event) => updateStatus(enquiry.id, event.target.value)}
                        className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeEnquiry(enquiry.id)}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border transition hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        ) : null}
      </main>
    </div>
  );
}

function normalizeFileBaseName(name: string, fallback: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

function humanizeFileBaseName(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,85,125,0.06)]">
      <div
        className={`grid h-11 w-11 place-items-center rounded-2xl ${
          accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 font-display text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    contacted: "bg-amber-100 text-amber-700",
    closed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wider ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function BannerCard({ banner, className = "" }: { banner: Banner; className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl border px-4 py-3 text-sm ${
        banner.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-destructive/20 bg-destructive/5 text-destructive"
      }`}
    >
      {banner.message}
    </div>
  );
}
