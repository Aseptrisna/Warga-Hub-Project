import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Heart, MessageCircle, ImagePlus, X, MoreHorizontal, MessagesSquare, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Role, RoleLabels } from '@shared/role.enum';
import { useAuthStore } from '../../stores/auth.store';
import { kicauService, KicauPost, KicauComment } from '../../services/kicau.service';
import { resolveFileUrl } from '../../utils/file-url';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Textarea, Input } from '../../components/ui/Input';

const MAX_CHARS = 500;
const MAX_PHOTOS = 4;
const PAGE_SIZE = 10;

const MODERATOR_ROLES: string[] = [
  Role.SUPER_ADMIN, Role.ADMIN_PLATFORM, Role.ADMIN_DESA,
  Role.KEPALA_DESA, Role.SEKRETARIS_DESA, Role.KETUA_RW, Role.KETUA_RT,
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: idLocale });
}

function roleLabel(role: string) {
  return RoleLabels[role as Role] || role;
}

function errorMessage(error: any, fallback: string) {
  const msg = error?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || fallback;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {initials(name)}
    </div>
  );
}

function PhotoGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className={cn('mt-3 grid gap-1.5 overflow-hidden rounded-lg', urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {urls.map((url) => (
        <a key={url} href={resolveFileUrl(url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100">
          <img
            src={resolveFileUrl(url)}
            alt="Foto kicauan"
            className={cn('w-full object-cover', urls.length === 1 ? 'max-h-96' : 'h-40')}
          />
        </a>
      ))}
    </div>
  );
}

function Composer({ onPosted }: { onPosted: (post: KicauPost) => void }) {
  const [isi, setIsi] = useState('');
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = MAX_CHARS - isi.length;
  const canSubmit = (isi.trim().length > 0 || photos.length > 0) && remaining >= 0 && !submitting;

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(files).slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...picked]);
    if (fileInput.current) fileInput.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await kicauService.create(isi.trim(), photos.map((p) => p.file));
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setIsi('');
      setPhotos([]);
      onPosted(res.data);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal mengirim', text: errorMessage(error, 'Coba lagi beberapa saat.') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <Textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        rows={3}
        placeholder="Ada kabar apa di lingkungan Anda?"
        className="resize-none border-0 px-0 focus:ring-0"
        aria-label="Tulis kicauan"
      />

      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
              <img src={p.preview} alt={`Lampiran ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 p-0.5 rounded bg-gray-900/70 text-white hover:bg-gray-900"
                aria-label={`Hapus foto ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addPhotos(e.target.files)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <ImagePlus className="w-4 h-4" /> Foto {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs tabular-nums', remaining < 0 ? 'text-red-600' : remaining < 50 ? 'text-amber-600' : 'text-gray-400')}>
            {remaining}
          </span>
          <Button size="sm" onClick={submit} disabled={!canSubmit}>
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Kirim
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Comments({
  post,
  canModerate,
  currentUserId,
  onCountChange,
}: {
  post: KicauPost;
  canModerate: boolean;
  currentUserId: string;
  onCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState<KicauComment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async (nextPage: number) => {
    try {
      setLoading(true);
      const res = await kicauService.getComments(post.id, { page: nextPage, limit: PAGE_SIZE });
      setComments((prev) => (nextPage === 1 ? res.data : [...prev, ...res.data]));
      setPage(nextPage);
      setTotalPages(res.meta.totalPages);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal memuat komentar', text: errorMessage(error, 'Coba lagi.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const isi = reply.trim();
    if (!isi || sending) return;
    try {
      setSending(true);
      const res = await kicauService.addComment(post.id, isi);
      setComments((prev) => [...prev, res.data]);
      setReply('');
      onCountChange(1);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal mengirim komentar', text: errorMessage(error, 'Coba lagi.') });
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: KicauComment) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus komentar ini?',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    try {
      await kicauService.deleteComment(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      onCountChange(-1);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: errorMessage(error, 'Coba lagi.') });
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5 group">
          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
            {initials(c.authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-900">{c.authorName}</span>
              <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
              {(c.authorUserId === currentUserId || canModerate) && (
                <button
                  onClick={() => remove(c)}
                  className="ml-auto text-xs text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  Hapus
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line break-words">{c.isi}</p>
          </div>
        </div>
      ))}

      {!loading && comments.length === 0 && <p className="text-xs text-gray-400">Belum ada komentar.</p>}
      {loading && <p className="text-xs text-gray-400">Memuat komentar...</p>}
      {!loading && page < totalPages && (
        <button onClick={() => load(page + 1)} className="text-xs font-medium text-primary-700 hover:underline">
          Lihat komentar lainnya
        </button>
      )}

      <div className="flex gap-2">
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          maxLength={300}
          placeholder="Tulis balasan"
          aria-label="Tulis balasan"
          className="py-1.5"
        />
        <Button size="sm" variant="secondary" onClick={send} disabled={!reply.trim() || sending}>
          Balas
        </Button>
      </div>
    </div>
  );
}

function PostItem({
  post,
  currentUserId,
  canModerate,
  onChange,
  onRemove,
}: {
  post: KicauPost;
  currentUserId: string;
  canModerate: boolean;
  onChange: (post: KicauPost) => void;
  onRemove: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const isAuthor = post.authorUserId === currentUserId;

  const toggleLike = async () => {
    if (liking) return;
    const previous = post;
    onChange({
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    });
    try {
      setLiking(true);
      const res = await kicauService.toggleLike(post.id);
      onChange({ ...previous, likedByMe: res.liked, likeCount: res.likeCount });
    } catch (error: any) {
      onChange(previous);
      Swal.fire({ icon: 'error', title: 'Gagal', text: errorMessage(error, 'Coba lagi.') });
    } finally {
      setLiking(false);
    }
  };

  const remove = async () => {
    setMenuOpen(false);
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus kicauan ini?',
      text: 'Komentar di dalamnya ikut terhapus.',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    });
    if (!confirm.isConfirmed) return;
    try {
      await kicauService.deletePost(post.id);
      onRemove(post.id);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus', text: errorMessage(error, 'Coba lagi.') });
    }
  };

  const hide = async () => {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: 'Sembunyikan kicauan',
      input: 'text',
      inputLabel: 'Alasan (terlihat di catatan moderasi)',
      inputPlaceholder: 'Misal: mengandung informasi pribadi warga',
      showCancelButton: true,
      confirmButtonText: 'Sembunyikan',
      cancelButtonText: 'Batal',
      inputValidator: (value) => (!value?.trim() ? 'Alasan wajib diisi' : undefined),
    });
    if (!result.isConfirmed) return;
    try {
      await kicauService.hidePost(post.id, result.value.trim());
      onRemove(post.id);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: errorMessage(error, 'Coba lagi.') });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar name={post.authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{post.authorName}</p>
              <p className="text-xs text-gray-500">
                {roleLabel(post.authorRole)}
                {post.rt && ` · RT ${post.rt}`}
                {post.rw && `/RW ${post.rw}`} · {timeAgo(post.createdAt)}
              </p>
            </div>
            {(isAuthor || canModerate) && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  aria-label="Opsi kicauan"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-sm z-20 py-1 text-sm">
                      {canModerate && !isAuthor && (
                        <button onClick={hide} className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                          Sembunyikan
                        </button>
                      )}
                      <button onClick={remove} className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-gray-50">
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {post.isi && <p className="mt-2 text-sm text-gray-800 whitespace-pre-line break-words">{post.isi}</p>}
          <PhotoGrid urls={post.fotoUrls || []} />

          <div className="mt-3 flex items-center gap-5">
            <button
              onClick={toggleLike}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                post.likedByMe ? 'text-red-600' : 'text-gray-500 hover:text-red-600',
              )}
              aria-pressed={post.likedByMe}
              aria-label={post.likedByMe ? 'Batal suka' : 'Suka'}
            >
              <Heart className={cn('w-4 h-4', post.likedByMe && 'fill-current')} />
              <span className="tabular-nums">{post.likeCount}</span>
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                showComments ? 'text-primary-700' : 'text-gray-500 hover:text-primary-700',
              )}
              aria-expanded={showComments}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="tabular-nums">{post.commentCount}</span>
            </button>
          </div>

          {showComments && (
            <Comments
              post={post}
              canModerate={canModerate}
              currentUserId={currentUserId}
              onCountChange={(delta) => onChange({ ...post, commentCount: Math.max(0, post.commentCount + delta) })}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

export default function KicauDesaPage() {
  const user = useAuthStore((s) => s.user);
  const currentUserId = String(user?.id || '');
  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);

  const [posts, setPosts] = useState<KicauPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (nextPage: number) => {
    try {
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      const res = await kicauService.getFeed({ page: nextPage, limit: PAGE_SIZE });
      setPosts((prev) => {
        if (nextPage === 1) return res.data;
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.data.filter((p) => !seen.has(p.id))];
      });
      setPage(nextPage);
      setTotalPages(res.meta.totalPages);
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal memuat Kicau Desa', text: errorMessage(error, 'Coba muat ulang halaman.') });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePost = (updated: KicauPost) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const removePost = (id: string) => setPosts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="max-w-[640px] mx-auto">
      <PageHeader
        title="Kicau Desa"
        subtitle={user?.desa ? `Kabar dan obrolan warga ${user.desa}` : 'Kabar dan obrolan warga desa'}
      />

      <div className="space-y-3">
        <Composer onPosted={(post) => setPosts((prev) => [post, ...prev])} />

        {loading ? (
          <div className="py-12 flex justify-center text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <EmptyState
              icon={MessagesSquare}
              title="Belum ada kicauan"
              description="Kicauan pertama dari warga desa Anda akan muncul di sini."
            />
          </Card>
        ) : (
          <>
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                canModerate={canModerate}
                onChange={updatePost}
                onRemove={removePost}
              />
            ))}
            {page < totalPages && (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" size="sm" onClick={() => load(page + 1)} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Muat lebih banyak
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
