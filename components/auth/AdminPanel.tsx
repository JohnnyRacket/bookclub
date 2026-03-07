"use client";

import { useTransition, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteUserSessions,
  resetUserPin,
  type MemberRow,
} from "@/lib/actions/admin";
import {
  setCurrentBook,
  deleteSubmittedBook,
  updateBook,
  type SubmittedBookRow,
  type CurrentBookAdmin,
} from "@/lib/actions/admin-books";
import { updateClubConfig, type ClubConfig } from "@/lib/actions/settings";
import {
  deleteCustomReaction,
  type CustomReaction,
} from "@/lib/actions/reactions";
import {
  startVotingSession,
  closeVotingSession,
  startRandomSelection,
  type SessionSnapshot,
} from "@/lib/actions/book-selection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Distinct soft colors for member avatars
const AVATAR_COLORS = [
  "oklch(0.75 0.14 250)",
  "oklch(0.72 0.14 330)",
  "oklch(0.72 0.14 160)",
  "oklch(0.75 0.14 50)",
  "oklch(0.72 0.14 290)",
  "oklch(0.75 0.14 200)",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function MemberActions({ member }: { member: MemberRow }) {
  const [isPending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  function handleLogout() {
    startTransition(async () => {
      await deleteUserSessions(member.id);
    });
  }

  function handleResetPin() {
    startTransition(async () => {
      await resetUserPin(member.id);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isPending || member.sessionCount === 0}
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          Sign out
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmReset(true)}
          disabled={isPending}
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          Reset PIN
        </Button>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {member.name}&apos;s PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be logged out and must set a new PIN on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPin}>
              Reset PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CurrentBookEditor({ book }: { book: CurrentBookAdmin }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const genres = book.genres
    ? (JSON.parse(book.genres) as string[]).join(", ")
    : "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateBook(book.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        setCoverPreview(null);
      }
    });
  }

  const coverSrc = coverPreview ?? book.cover_url;

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] overflow-hidden">
      {/* Header row */}
      <div className="px-5 py-4 flex items-center gap-4">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={book.title}
            className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
            style={{
              background:
                "color-mix(in oklch, var(--color-primary) 12%, white)",
            }}
          >
            📖
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground truncate"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            {book.title}
          </p>
          <p
            className="text-xs text-muted-foreground truncate"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {book.author}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing((v) => !v);
            setError(null);
            setCoverPreview(null);
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4"
        >
          <input
            type="hidden"
            name="existing_cover_url"
            value={book.cover_url ?? ""}
          />
          <input type="hidden" name="cover_url" value="" />

          {/* Cover */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Cover Image
            </label>
            {coverSrc && (
              <div className="flex justify-center mb-3">
                <img
                  src={coverSrc}
                  alt="Cover preview"
                  className="w-20 h-28 object-cover rounded-xl shadow-md"
                />
              </div>
            )}
            <input
              type="file"
              name="cover_file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (previewUrlRef.current)
                  URL.revokeObjectURL(previewUrlRef.current);
                const url = file ? URL.createObjectURL(file) : null;
                previewUrlRef.current = url;
                setCoverPreview(url);
              }}
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          {/* Title */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={book.title}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>

          {/* Author */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Author <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="author"
              required
              defaultValue={book.author}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>

          {/* Year + Pages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                Year
              </label>
              <input
                type="number"
                name="year"
                defaultValue={book.year ?? ""}
                min={1000}
                max={2100}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                style={{ fontFamily: "var(--font-nunito)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                Pages
              </label>
              <input
                type="number"
                name="pages"
                defaultValue={book.pages ?? ""}
                min={1}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
                style={{ fontFamily: "var(--font-nunito)" }}
              />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Genres{" "}
              <span className="font-normal normal-case">(comma-separated)</span>
            </label>
            <input
              type="text"
              name="genres"
              defaultValue={genres}
              placeholder="Fiction, Historical, Mystery…"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>

          {error && (
            <div
              className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            style={{
              background: "var(--color-primary)",
              fontFamily: "var(--font-nunito)",
            }}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      )}
    </div>
  );
}

function SubmittedBookActions({ book }: { book: SubmittedBookRow }) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<
    "set-current" | "reject" | null
  >(null);

  function handleSetCurrent() {
    startTransition(async () => {
      await setCurrentBook(book.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteSubmittedBook(book.id);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmAction("set-current")}
          disabled={isPending}
          className="text-green-700 border-green-200 hover:bg-green-50"
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          Set Current
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmAction("reject")}
          disabled={isPending}
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          Reject
        </Button>
      </div>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "set-current"
                ? `Set "${book.title}" as current?`
                : `Reject "${book.title}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "set-current"
                ? "This will replace the current book for the club."
                : "This will permanently delete this submission."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirmAction === "set-current"
                  ? handleSetCurrent
                  : handleDelete
              }
              className={
                confirmAction === "reject"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction === "set-current" ? "Set Current" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VotingSessionManager({
  openSession,
  selectionMode,
  submittedBookCount,
}: {
  openSession: SessionSnapshot | null;
  selectionMode: "admin" | "vote" | "random";
  submittedBookCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmStartVote, setConfirmStartVote] = useState(false);

  if (selectionMode === "admin") return null;

  function handleStartVote() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await startVotingSession();
      if (res.error) {
        setError(res.error);
      } else if (res.sessionId) {
        router.push(`/select-book/vote/${res.sessionId}`);
      }
    });
  }

  function handleCloseVoting() {
    if (!openSession) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await closeVotingSession(openSession.id);
      if (res.error) {
        setError(res.error);
      } else {
        setMessage("Voting closed. Go to the vote page to finalize.");
      }
    });
  }

  function handleRandomPick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await startRandomSelection();
      if (res.error) {
        setError(res.error);
      } else if (res.redirect) {
        router.push(res.redirect);
      } else {
        setMessage("Book selected! Check the home page.");
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] p-5 space-y-4">
        {selectionMode === "vote" && (
          <>
            {!openSession ? (
              <>
              <div className="text-center space-y-3">
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  No active voting session.
                </p>
                <Button
                  onClick={() => setConfirmStartVote(true)}
                  disabled={isPending || submittedBookCount === 0}
                  title={submittedBookCount === 0 ? "No books have been submitted yet" : undefined}
                  style={{
                    background: "var(--color-primary)",
                    fontFamily: "var(--font-nunito)",
                  }}
                >
                  Start Voting Session
                </Button>
              </div>

              <AlertDialog open={confirmStartVote} onOpenChange={setConfirmStartVote}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start a voting session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All submitted books will be put up for a vote. Members will be notified and can cast their votes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => { setConfirmStartVote(false); handleStartVote(); }}
                      style={{ background: "var(--color-primary)" }}
                    >
                      Start Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background:
                          openSession.status === "open"
                            ? "color-mix(in oklch, var(--color-primary) 15%, white)"
                            : "#fef3c7",
                        color:
                          openSession.status === "open"
                            ? "var(--color-primary)"
                            : "#92400e",
                        fontFamily: "var(--font-nunito)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background:
                            openSession.status === "open"
                              ? "var(--color-primary)"
                              : "#f59e0b",
                        }}
                      />
                      {openSession.status === "open"
                        ? "Voting Open"
                        : "Voting Closed"}
                    </span>
                  </div>
                  <div
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-nunito)" }}
                  >
                    {openSession.total_votes_cast} votes ·{" "}
                    {openSession.total_voters} members
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/select-book/vote/${openSession.id}`}
                    className="flex-1 text-center py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                      background: "var(--color-primary)",
                      fontFamily: "var(--font-nunito)",
                    }}
                  >
                    Open Vote Page
                  </Link>
                  {openSession.status === "open" && (
                    <Button
                      variant="outline"
                      onClick={handleCloseVoting}
                      disabled={isPending}
                      style={{ fontFamily: "var(--font-nunito)" }}
                    >
                      Close Voting
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {selectionMode === "random" && (
          <div className="text-center space-y-3">
            <p
              className="text-sm text-muted-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Randomly pick from submitted books.
            </p>
            <Button
              onClick={handleRandomPick}
              disabled={isPending || submittedBookCount === 0}
              title={submittedBookCount === 0 ? "No books have been submitted yet" : undefined}
              style={{
                background: "var(--color-primary)",
                fontFamily: "var(--font-nunito)",
              }}
            >
              {isPending ? "Picking…" : "Pick Random Book"}
            </Button>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {message}
          </div>
        )}
    </div>
  );
}

function ClubSettingsEditor({ settings, hasAdminPin }: { settings: ClubConfig; hasAdminPin: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [colorHex, setColorHex] = useState(settings.primaryColor);
  const [emojiRaw, setEmojiRaw] = useState(settings.emojiReactions.join(","));
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const logoPreviewUrlRef = useRef<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(settings.selectionMode);
  const [randomReveal, setRandomReveal] = useState(settings.randomReveal);
  const [purgeAfterSelection, setPurgeAfterSelection] = useState(settings.purgeAfterSelection);
  const [pinlessAdmin, setPinlessAdmin] = useState(settings.pinlessAdmin);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("idle");
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateClubConfig(formData);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("success");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Club Settings
        </p>
        <p
          className="text-xs text-muted-foreground mt-0.5"
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          Overrides defaults
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 pb-5 pt-4 space-y-4">
        {/* Club Name */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Club Name
          </label>
          <input
            type="text"
            name="club_name"
            defaultValue={settings.name}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{ fontFamily: "var(--font-nunito)" }}
          />
        </div>

        {/* Primary Color */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="primary_color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <span
              className="text-sm font-mono text-muted-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              {colorHex}
            </span>
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Logo <span className="font-normal normal-case">(optional)</span>
          </label>
          {/* Hidden remove flag */}
          <input
            type="hidden"
            name="logo_remove"
            value={logoRemoved ? "1" : "0"}
          />
          {/* Current / preview */}
          {(() => {
            const src = logoRemoved ? null : (logoPreview ?? settings.logoUrl);
            return src ? (
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={src}
                  alt="Logo preview"
                  className="h-12 w-12 object-contain rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (logoPreviewUrlRef.current) {
                      URL.revokeObjectURL(logoPreviewUrlRef.current);
                      logoPreviewUrlRef.current = null;
                    }
                    setLogoPreview(null);
                    setLogoRemoved(true);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  Remove
                </button>
              </div>
            ) : null;
          })()}
          <input
            type="file"
            name="logo_file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (logoPreviewUrlRef.current)
                URL.revokeObjectURL(logoPreviewUrlRef.current);
              const url = file ? URL.createObjectURL(file) : null;
              logoPreviewUrlRef.current = url;
              setLogoPreview(url);
              setLogoRemoved(false);
            }}
            className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        {/* Emoji Reactions */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Emoji Reactions{" "}
            <span className="font-normal normal-case">
              (comma-separated, leave blank for none)
            </span>
          </label>
          <textarea
            name="emoji_reactions"
            value={emojiRaw}
            onChange={(e) => setEmojiRaw(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow resize-none"
            style={{ fontFamily: "var(--font-nunito)" }}
          />
          {emojiRaw.trim() && (
            <div className="flex flex-wrap gap-1 mt-2">
              {emojiRaw
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
                .map((emoji, i) => (
                  <span key={i} className="text-xl">
                    {emoji}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Thumbs emojis */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Thumbs Up
            </label>
            <input
              type="text"
              name="thumbs_up_emoji"
              defaultValue={settings.thumbsUpEmoji}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Thumbs Down
            </label>
            <input
              type="text"
              name="thumbs_down_emoji"
              defaultValue={settings.thumbsDownEmoji}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>
        </div>

        {/* Max Submissions */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Max Submissions Per Member
          </label>
          <input
            type="number"
            name="max_submissions"
            defaultValue={settings.maxSubmissionsPerMember}
            min={1}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
            style={{ fontFamily: "var(--font-nunito)" }}
          />
        </div>

        {/* Selection Mode */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Book Selection Mode
          </label>
          <Select
            value={selectionMode}
            onValueChange={(v) => setSelectionMode(v as typeof selectionMode)}
            name="selection_mode"
          >
            <SelectTrigger className="w-full" style={{ fontFamily: "var(--font-nunito)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vote">Vote (democratic)</SelectItem>
              <SelectItem value="admin">Admin picks</SelectItem>
              <SelectItem value="random">Random pick</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectionMode === "vote" && (
          <>
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                Votes Per Member
              </label>
              <input
                type="number"
                name="votes_per_member"
                defaultValue={settings.votesPerMember}
                min={1}
                max={10}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-shadow"
                style={{ fontFamily: "var(--font-nunito)" }}
              />
            </div>
          </>
        )}

        {selectionMode === "random" && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
              Animated reveal show
            </span>
            <Switch size="lg" checked={randomReveal} onCheckedChange={setRandomReveal} />
            <input type="hidden" name="random_reveal" value={randomReveal ? "1" : "0"} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
              Purge pending submissions after selection
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs font-bold cursor-default select-none">?</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56 text-center">
                  When enabled, all submitted books that weren&apos;t chosen are deleted after a selection is made — keeping the queue clean for the next round. Disable to carry them forward.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch size="lg" checked={purgeAfterSelection} onCheckedChange={setPurgeAfterSelection} />
          <input type="hidden" name="purge_after_selection" value={purgeAfterSelection ? "1" : "0"} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-foreground" style={{ fontFamily: "var(--font-nunito)" }}>
                Pinless admin
              </span>
              {!hasAdminPin && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'color-mix(in oklch, var(--color-primary) 12%, white)',
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-nunito)',
                  }}
                >
                  always on (no PIN set)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "var(--font-nunito)" }}>
              Any member can elevate to admin without a PIN
            </p>
          </div>
          <Switch size="lg" checked={pinlessAdmin} onCheckedChange={setPinlessAdmin} />
          <input type="hidden" name="pinless_admin" value={pinlessAdmin ? "1" : "0"} />
        </div>

        {status === "error" && errorMsg && (
          <div
            className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {errorMsg}
          </div>
        )}
        {status === "success" && (
          <div
            className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            Settings saved.
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{
            background: "var(--color-primary)",
            fontFamily: "var(--font-nunito)",
          }}
        >
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}

function CustomReactionsEditor({ reactions }: { reactions: CustomReaction[] }) {
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteCustomReaction(id);
      setConfirmId(null);
    });
  }

  if (reactions.length === 0) {
    return (
      <div
        className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-8 text-center text-sm text-muted-foreground"
        style={{ fontFamily: "var(--font-nunito)" }}
      >
        No custom reactions yet.
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] p-4">
        <div className="grid grid-cols-5 gap-3">
          {reactions.map((reaction) => (
            <div key={reaction.id} className="relative group">
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50">
                <img
                  src={reaction.image_path}
                  alt={reaction.label ?? "reaction"}
                  className="w-14 h-14 object-contain"
                />
              </div>
              {reaction.label && (
                <p
                  className="text-[10px] text-center text-muted-foreground mt-1 truncate"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  {reaction.label}
                </p>
              )}
              <button
                onClick={() => setConfirmId(reaction.id)}
                disabled={isPending}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                aria-label="Delete reaction"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the reaction and its image file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId !== null && handleDelete(confirmId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AdminPanel({
  members,
  submittedBooks,
  currentBook,
  clubSettings,
  customReactions,
  openSession,
  hasAdminPin,
}: {
  members: MemberRow[];
  submittedBooks: SubmittedBookRow[];
  currentBook: CurrentBookAdmin | null;
  clubSettings: ClubConfig;
  customReactions: CustomReaction[];
  openSession: SessionSnapshot | null;
  hasAdminPin: boolean;
}) {
  return (
    <div className="w-full max-w-xl animate-page-in">
      {/* Header */}
      <div className="mb-6 stagger">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
          style={{ fontFamily: "var(--font-nunito)" }}
        >
          ← Home
        </Link>
        <div className="text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-nunito)",
            }}
          >
            Admin
          </p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Club Admin
          </h1>
          <p
            className="mt-1 text-sm text-muted-foreground"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {members.length} member{members.length !== 1 ? "s" : ""} in the club
          </p>
        </div>
      </div>

      {/* Current Book */}
      {currentBook && (
        <div className="mb-8 stagger">
          <div className="mb-4 text-center">
            <h2
              className="text-2xl font-semibold text-foreground"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Current Book
            </h2>
          </div>
          <CurrentBookEditor book={currentBook} />
        </div>
      )}

      {/* Members */}
      <div className="mb-4 text-center stagger">
        <h2
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Members
        </h2>
      </div>

      {/* Member list — each row is its own floating card */}
      <div className="space-y-3 stagger">
        {members.length === 0 ? (
          <div
            className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-10 text-center text-sm text-muted-foreground"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            No members yet.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div
                className="h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{
                  background: getAvatarColor(member.name),
                  fontFamily: "var(--font-fredoka)",
                }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold text-foreground truncate"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    {member.name}
                  </span>
                  {member.pin_reset === 1 && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]"
                      style={{ fontFamily: "var(--font-nunito)" }}
                    >
                      PIN reset
                    </Badge>
                  )}
                </div>
                <div
                  className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"
                  style={{ fontFamily: "var(--font-nunito)" }}
                >
                  <span>Joined {formatDate(member.created_at)}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">
                    {member.sessionCount} session
                    {member.sessionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <MemberActions member={member} />
            </div>
          ))
        )}
      </div>

      {/* Book Queue */}
      <div className="mt-10 stagger">
        <div className="mb-4 text-center">
          <h2
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Book Queue
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {submittedBooks.length} pending submission
            {submittedBooks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <VotingSessionManager
          openSession={openSession}
          selectionMode={clubSettings.selectionMode}
          submittedBookCount={submittedBooks.length}
        />

        {clubSettings.selectionMode !== "admin" && (
          <div className="my-4 border-t border-border" />
        )}

        <div className="space-y-3">
          {submittedBooks.length === 0 ? (
            <div
              className="bg-white rounded-3xl shadow-[var(--shadow-card)] p-8 text-center text-sm text-muted-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              No submissions yet.
            </div>
          ) : (
            submittedBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-4 flex items-center gap-4"
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                    style={{
                      background:
                        "color-mix(in oklch, var(--color-primary) 12%, white)",
                    }}
                  >
                    📖
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-foreground truncate"
                    style={{ fontFamily: "var(--font-fredoka)" }}
                  >
                    {book.title}
                  </p>
                  <p
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-nunito)" }}
                  >
                    {book.author}
                    {book.submitter_name && (
                      <span className="ml-2">· by {book.submitter_name}</span>
                    )}
                    <span className="ml-2">
                      · {formatDate(book.created_at)}
                    </span>
                  </p>
                </div>
                <SubmittedBookActions book={book} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tools */}
      <div className="mt-10 stagger space-y-3">
        <div className="mb-4 text-center">
          <h2
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Tools
          </h2>
        </div>
        <Link
          href="/admin/backfill"
          className="flex items-center gap-4 bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-4 hover:shadow-md transition-shadow"
        >
          <div
            className="h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg"
            style={{
              background:
                "color-mix(in oklch, var(--color-primary) 12%, white)",
            }}
          >
            📚
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Backfill Past Reads
            </p>
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Add historical books to the archive with a custom read date
            </p>
          </div>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>

        <Link
          href="/admin/override"
          className="flex items-center gap-4 bg-white rounded-2xl shadow-[var(--shadow-card-sm)] px-5 py-4 hover:shadow-md transition-shadow"
        >
          <div
            className="h-10 w-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg"
            style={{
              background:
                "color-mix(in oklch, var(--color-primary) 12%, white)",
            }}
          >
            ⚡
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Override Current Book
            </p>
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "var(--font-nunito)" }}
            >
              Force-set any book as current, bypassing voting and submission queue
            </p>
          </div>
          <span className="text-muted-foreground text-sm">→</span>
        </Link>
      </div>

      {/* Custom Reactions */}
      <div className="mt-10 stagger">
        <div className="mb-4 text-center">
          <h2
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Custom Reactions
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            style={{ fontFamily: "var(--font-nunito)" }}
          >
            {customReactions.length} custom reaction{customReactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CustomReactionsEditor reactions={customReactions} />
      </div>

      {/* Club Settings */}
      <div className="mt-10 stagger">
        <div className="mb-4 text-center">
          <h2
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Club Settings
          </h2>
        </div>
        <ClubSettingsEditor settings={clubSettings} hasAdminPin={hasAdminPin} />
      </div>
    </div>
  );
}
