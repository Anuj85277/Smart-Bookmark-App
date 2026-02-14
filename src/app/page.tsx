'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at?: string;
  user_id?: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [opError, setOpError] = useState<string | null>(null);

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    fetchBookmarks();

    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
        () => fetchBookmarks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetch error:', error);
      return;
    }

    setBookmarks((data as Bookmark[]) || []);
  };

  const normalizeUrl = (raw: string) => {
    if (!raw) return '';
    return raw.match(/^https?:\/\//) ? raw : `https://${raw}`;
  };

  const addBookmark = async () => {
    if (!title || !url || !user?.id) return;

    setOpError(null);
    setMessage('Adding bookmark...');

    const finalUrl = normalizeUrl(url.trim());

    const { error } = await supabase.from('bookmarks').insert({
      title: title.trim(),
      url: finalUrl,
      user_id: user.id,
    });

    if (error) {
      setOpError(error.message);
      setMessage(null);
      return;
    }

    setTitle('');
    setUrl('');
    setMessage('Bookmark added!');
    fetchBookmarks();
  };

  const deleteBookmark = async (id: string) => {
    setMessage('Deleting...');
    await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user.id);
    fetchBookmarks();
  };

  const startEdit = (b: Bookmark) => {
    setEditingId(b.id);
    setEditTitle(b.title || '');
    setEditUrl(b.url || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditUrl('');
  };

  const updateBookmark = async (id: string) => {
    setMessage('Updating...');
    const finalUrl = normalizeUrl(editUrl.trim());

    await supabase
      .from('bookmarks')
      .update({ title: editTitle.trim(), url: finalUrl })
      .eq('id', id)
      .eq('user_id', user.id);

    setMessage('Updated!');
    fetchBookmarks();
    cancelEdit();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loadingUser) {
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <button onClick={signInWithGoogle} className="px-6 py-3 bg-black text-black rounded-lg">
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="max-w-2xl w-60 ">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 bg-gray-500">
          <h2 className="text-xl font-bold">🔖 Smart Bookmark App</h2>
          <button onClick={signOut} className="bg-red-600 text-blue-50 px-4 py-1 rounded-full">
            Logout
          </button>
        </header>

        {/* Add Bookmark */}
        <section className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="border p-2 rounded"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="border p-2 rounded"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={addBookmark}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4"
            >
              Add
            </button>
          </div>

          {opError && <p className="text-red-600 mt-2">{opError}</p>}
          {message && <p className="text-green-600 mt-2">{message}</p>}
        </section>

        {/* List */}
        <ul className="space-y-3">
          {bookmarks.map((b) => (
            <li key={b.id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
              <div>
                {editingId === b.id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                ) : (
                  <a href={b.url} target="_blank" className="text-blue-600 font-semibold underline">
                    {b.title}
                  </a>
                )}
                <p className="text-xs text-gray-500">{b.url}</p>
              </div>

              <div className="flex gap-2">
                {editingId === b.id ? (
                  <>
                    <button
                      onClick={() => updateBookmark(b.id)}
                      className="bg-blue-600 text-black px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-yellow-400 text-black px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(b)}
                      className="bg-green-600 text-black px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="bg-red-600 text-black px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
