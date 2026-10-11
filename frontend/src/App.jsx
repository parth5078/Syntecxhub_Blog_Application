import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";
import "./RichTextEditor.css";

import {

  ArrowLeft,

  ArrowRight,

  BookOpen,

  Clock3,

  Feather,

  LogOut,

  Menu,

  PenLine,

  Plus,

  Search,

  Sparkles,

  X,

} from "lucide-react";



import Auth from "./Auth";

import "./App.css";



const API = "http://localhost:5000/api";



const demoBlogs = [

  {

    _id: "demo-1",

    title: "The quiet art of building something meaningful",

    content:

      "Great work rarely happens overnight. It begins with curiosity, patience, and the courage to start before everything feels perfect.",

    category: "Ideas",

    author: { name: "The Editorial Team" },

    createdAt: "2026-10-10",

    coverImage:

      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85",

  },

  {

    _id: "demo-2",

    title: "A more thoughtful approach to learning code",

    content:

      "Learning to program is less about memorizing every syntax and more about learning to ask the right questions and solve problems.",

    category: "Technology",

    author: { name: "Maya Shah" },

    createdAt: "2026-10-08",

    coverImage:

      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85",

  },

  {

    _id: "demo-3",

    title: "Your first portfolio is a beginning, not a finish line",

    content:

      "A portfolio is a living record of what you have learned, what you care about, and what you want to build next.",

    category: "Career",

    author: { name: "Arjun Mehta" },

    createdAt: "2026-10-06",

    coverImage:

      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85",

  },

];



const topics = ["For you", "Technology", "Programming", "Career", "Ideas"];



function savedUser() {

  try {

    return JSON.parse(localStorage.getItem("inkspace_user")) || null;

  } catch {

    return null;

  }

}



function stripHtml(value = "") {
  return String(value).replace(/<\/?[^>]+(>|$)/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function categoryOf(blog) {

  return blog.category || blog.tags?.[0] || "Ideas";

}



function authorOf(blog) {

  return blog.author?.name || blog.authorName || "Ink.space community";

}



function dateOf(blog) {

  const date = new Date(blog.createdAt || Date.now());



  return Number.isNaN(date.getTime())

    ? "Recently"

    : date.toLocaleDateString("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric",

      });

}



function App() {

  const [user, setUser] = useState(savedUser);

  const [token, setToken] = useState(

    () => localStorage.getItem("inkspace_token") || ""

  );



  const [showAuth, setShowAuth] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [blogs, setBlogs] = useState(demoBlogs);

  const [loading, setLoading] = useState(true);

  const [notice, setNotice] = useState("");

  const [topic, setTopic] = useState("For you");

  const [search, setSearch] = useState("");

  const [selectedBlog, setSelectedBlog] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);



  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [imageUrl, setImageUrl] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);

  const [uploadingImage, setUploadingImage] = useState(false);

  const [category, setCategory] = useState("Technology");



  // Load published stories

  useEffect(() => {

    let active = true;



    async function loadBlogs() {

      try {

        const response = await fetch(`${API}/blogs`);



        if (!response.ok) {

          throw new Error("Blog API unavailable");

        }



        const data = await response.json();



        if (active && Array.isArray(data)) {

          setBlogs(data);

        }

      } catch {

        if (active) {

          setBlogs(demoBlogs);

        }

      } finally {

        if (active) {

          setLoading(false);

        }

      }

    }



    loadBlogs();



    return () => {

      active = false;

    };

  }, []);



  // Search and category filtering

  const filteredBlogs = useMemo(

    () =>

      blogs.filter((blog) => {

        const matchesTopic =

          topic === "For you" ||

          categoryOf(blog).toLowerCase() === topic.toLowerCase();



        const term = search.trim().toLowerCase();



        const matchesSearch =

          !term ||

          (blog.title || "").toLowerCase().includes(term) ||

          stripHtml(blog.content || "").toLowerCase().includes(term) ||

          authorOf(blog).toLowerCase().includes(term);



        return matchesTopic && matchesSearch;

      }),

    [blogs, topic, search]

  );



  const featured = filteredBlogs[0];

  const remaining = filteredBlogs.slice(1);



  // Handle successful login or registration flow

  function handleLogin(data) {

    localStorage.setItem("inkspace_token", data.token);

    localStorage.setItem("inkspace_user", JSON.stringify(data.user));



    setToken(data.token);

    setUser(data.user);

    setShowAuth(false);

    setNotice(`Welcome to Ink.space, ${data.user.name || "reader"}.`);

  }



  function logout() {

    localStorage.removeItem("inkspace_token");

    localStorage.removeItem("inkspace_user");



    setToken("");

    setUser(null);

    setEditorOpen(false);

    setSelectedBlog(null);

    setNotice("You have signed out.");

  }



  function startWriting() {

    if (!token) {

      setAuthMode("login");

      setShowAuth(true);

      return;

    }



    setEditingBlog(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setSelectedImage(null);
    setCategory("Technology");
    setEditorOpen(true);
    setSelectedBlog(null);
    setNotice("");

  }



  // Upload selected cover image to the backend

  async function uploadCoverImage() {

    if (!selectedImage) {

      return imageUrl.trim();

    }



    const formData = new FormData();

    formData.append("image", selectedImage);



    setUploadingImage(true);



    try {

      const response = await fetch(`${API}/upload`, {

        method: "POST",

        headers: {

          Authorization: `Bearer ${token}`,

        },

        body: formData,

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Image upload failed");

      }



      return data.imageUrl || "";

    } finally {

      setUploadingImage(false);

    }

  }



  // Publish a new blog

  async function publishStory(event) {

    event.preventDefault();

    if (!stripHtml(content)) {
      setNotice("Please write some content before publishing.");
      return;
    }

    if (!token) {

      setAuthMode("login");

      setShowAuth(true);

      return;

    }



    setSaving(true);

    setNotice("");



    try {

      const uploadedImageUrl = await uploadCoverImage();



      const response = await fetch(
        editingBlog ? `${API}/blogs/${editingBlog._id}` : `${API}/blogs`,
        {
        method: editingBlog ? "PUT" : "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({

          title: title.trim(),

          content: content,

          coverImage: uploadedImageUrl,

          tags: [category],

        }),

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Could not publish your story.");

      }



      const savedBlog = {
        ...(editingBlog || {}),
        ...data,
        category: data.category || category,
        coverImage: data.coverImage || uploadedImageUrl,
      };

      setBlogs((current) =>
        editingBlog
          ? current.map((blog) =>
              String(blog._id) === String(editingBlog._id) ? savedBlog : blog
            )
          : [savedBlog, ...current.filter((blog) => !String(blog._id).startsWith("demo-"))]
      );

      setTitle("");
      setContent("");
      setImageUrl("");
      setSelectedImage(null);
      setCategory("Technology");
      setEditingBlog(null);
      setEditorOpen(false);
      setTopic("For you");
      setNotice(editingBlog ? "Your story has been updated." : "Your story has been published.");

    } catch (error) {

      setNotice(error.message || "Could not connect to the blog server.");

    } finally {

      setSaving(false);

    }

  }



  // Delete a story written by the logged-in user

  function startEditing(blog) {
    if (!token) {
      setAuthMode("login");
      setShowAuth(true);
      return;
    }

    const authorId = blog.author?._id || blog.author;
    const currentUserId = user?.id || user?._id;
    if (!currentUserId || String(authorId) !== String(currentUserId)) {
      setNotice("You can only edit your own stories.");
      return;
    }

    setEditingBlog(blog);
    setTitle(blog.title || "");
    setContent(blog.content || "");
    setCategory(categoryOf(blog));
    setImageUrl(blog.coverImage || "");
    setSelectedImage(null);
    setSelectedBlog(null);
    setEditorOpen(true);
    setNotice("");
  }

  function cancelEditor() {
    setEditorOpen(false);
    setEditingBlog(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setSelectedImage(null);
    setCategory("Technology");
  }

  async function deleteStory(blog) {

    if (!token || !blog._id || String(blog._id).startsWith("demo-")) {

      setNotice("Sign in and select a published story to delete.");

      return;

    }



    if (!window.confirm("Delete this story? This cannot be undone.")) {

      return;

    }



    try {

      const response = await fetch(`${API}/blogs/${blog._id}`, {

        method: "DELETE",

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Could not delete story.");

      }



      setBlogs((current) =>

        current.filter((item) => item._id !== blog._id)

      );



      setSelectedBlog(null);

      setNotice("Story deleted.");

    } catch (error) {

      setNotice(error.message || "Could not delete story.");

    }

  }



  // Authentication screen

  if (showAuth) {

    return (

      <Auth

        initialMode={authMode}

        onBack={() => setShowAuth(false)}

        onLogin={handleLogin}

      />

    );

  }



  return (

    <div className="site-shell">

      <header className="site-header">

        <a

          href="#home"

          className="wordmark"

          onClick={() => {

            setSelectedBlog(null);

            setEditorOpen(false);

          }}

        >

          <span className="wordmark-icon">

            <Feather size={21} />

          </span>

          <span>

            ink<span className="wordmark-dot">.</span>space

          </span>

        </a>



        <nav className={`main-nav ${mobileMenu ? "main-nav-open" : ""}`}>

          <a

            href="#stories"

            onClick={() => setMobileMenu(false)}

          >

            Discover

          </a>



          <a

            href="#about"

            onClick={() => setMobileMenu(false)}

          >

            About

          </a>



          <button className="mobile-write" onClick={startWriting}>

            <PenLine size={16} /> Write

          </button>

        </nav>



        <div className="header-actions">

          <button className="write-button" onClick={startWriting}>

            <PenLine size={16} /> Write a story

          </button>



          {user ? (

            <div className="user-controls">

              <span className="user-avatar">

                {(user.name || "U").slice(0, 1).toUpperCase()}

              </span>



              <span className="user-name">{user.name || "Reader"}</span>



              <button

                className="icon-button"

                onClick={logout}

                title="Sign out"

                aria-label="Sign out"

              >

                <LogOut size={17} />

              </button>

            </div>

          ) : (

            <button

              className="signin-button"

              onClick={() => {

                setAuthMode("login");

                setShowAuth(true);

              }}

            >

              Sign in

            </button>

          )}



          <button

            className="menu-toggle"

            onClick={() => setMobileMenu(!mobileMenu)}

            aria-label="Toggle navigation"

          >

            {mobileMenu ? <X size={21} /> : <Menu size={21} />}

          </button>

        </div>

      </header>



      <main id="home">

        {!selectedBlog && !editorOpen && (

          <>

            <section className="editorial-hero">

              <div className="hero-copy">

                <div className="eyebrow">

                  <Sparkles size={14} /> A PUBLICATION FOR CURIOUS MINDS

                </div>



                <h1>

                  Ideas grow

                  <br />

                  when they're <em>shared.</em>

                </h1>



                <p>

                  Thoughtful stories on technology, creativity, careers, and

                  everything that makes us curious.

                </p>



                <div className="hero-actions">

                  <a href="#stories" className="primary-button">

                    Explore stories <ArrowRight size={17} />

                  </a>



                  <button className="text-button" onClick={startWriting}>

                    Start writing <PenLine size={16} />

                  </button>

                </div>



                <div className="hero-footnote">

                  <span className="status-dot" />

                  Independent ideas. Real people. Fresh perspectives.

                </div>

              </div>



              <div className="hero-visual">

                <img

                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1100&q=85"

                  alt="Notebook and pen on a writing desk"

                />



                <div className="visual-caption">

                  <span>THE ART OF BEGINNING</span>

                  <strong>Every great idea starts somewhere.</strong>

                </div>



                <div className="visual-note">

                  <Feather size={17} />

                  <span>

                    Make room for

                    <br />

                    <strong>new perspectives.</strong>

                  </span>

                </div>

              </div>

            </section>



            <section className="reading-section" id="stories">

              <div className="section-title-row">

                <div>

                  <span className="eyebrow">THE READING ROOM</span>

                  <h2>

                    Stories worth your time<span>.</span>

                  </h2>

                  <p>Find your next thought-provoking read.</p>

                </div>



                <div className="search-field">

                  <Search size={17} />

                  <input

                    value={search}

                    onChange={(event) => setSearch(event.target.value)}

                    placeholder="Search stories"

                    aria-label="Search stories"

                  />

                </div>

              </div>



              <div className="topic-bar">

                <div className="topic-scroll">

                  {topics.map((item) => (

                    <button

                      key={item}

                      className={`topic-tab ${

                        topic === item ? "topic-active" : ""

                      }`}

                      onClick={() => setTopic(item)}

                    >

                      {item}

                    </button>

                  ))}

                </div>



                <span className="story-total">

                  {filteredBlogs.length} stories

                </span>

              </div>

            </section>

          </>

        )}



        {notice && (

          <div className="notice-bar" role="status">

            <span>{notice}</span>

            <button

              onClick={() => setNotice("")}

              aria-label="Dismiss"

            >

              <X size={16} />

            </button>

          </div>

        )}



        {editorOpen ? (

          <section className="writing-page">

            <button

              className="back-link"

              onClick={cancelEditor}

            >

              <ArrowLeft size={16} /> Back to stories

            </button>



            <div className="writing-heading">

              <span className="eyebrow">YOUR CREATIVE SPACE</span>

              <h1>

                {editingBlog ? "Edit your" : "Write something"} <em>{editingBlog ? "story." : "meaningful."}</em>

              </h1>

              <p>Don't worry about perfection. Begin with an idea.</p>

            </div>



            <form className="story-form" onSubmit={publishStory}>

              <label>

                Story title

                <input

                  value={title}

                  onChange={(event) => setTitle(event.target.value)}

                  placeholder="Give your story a title..."

                  required

                  maxLength={180}

                />

              </label>



              <div className="form-row">

                <label>

                  Topic

                  <select

                    value={category}

                    onChange={(event) => setCategory(event.target.value)}

                  >

                    {topics.slice(1).map((item) => (

                      <option key={item} value={item}>

                        {item}

                      </option>

                    ))}

                  </select>

                </label>



                <label>

                  Cover image

                  <span className="optional-label">

                    Choose an image (max 5 MB)

                  </span>



                  <input

                    type="file"

                    accept="image/jpeg,image/png,image/webp,image/gif"

                    onChange={(event) => {

                      const file = event.target.files?.[0];



                      if (!file) return;



                      if (

                        ![

                          "image/jpeg",

                          "image/png",

                          "image/webp",

                          "image/gif",

                        ].includes(file.type)

                      ) {

                        setNotice("Choose a JPG, PNG, WEBP or GIF image.");

                        event.target.value = "";

                        return;

                      }



                      if (file.size > 5 * 1024 * 1024) {

                        setNotice("Image must be 5 MB or smaller.");

                        event.target.value = "";

                        return;

                      }



                      setSelectedImage(file);

                      setImageUrl("");

                      setNotice("");

                    }}

                  />



                  {selectedImage && (

                    <span className="optional-label">

                      Selected: {selectedImage.name}

                    </span>

                  )}



                  {!selectedImage && (

                    <span className="optional-label">

                      You can leave this empty.

                    </span>

                  )}

                </label>

              </div>



              {selectedImage && (

                <div className="cover-preview">

                  <img

                    src={URL.createObjectURL(selectedImage)}

                    alt="Selected cover preview"

                  />

                  <button

                    type="button"

                    className="text-button"

                    onClick={() => setSelectedImage(null)}

                  >

                    Remove image <X size={15} />

                  </button>

                </div>

              )}



              <label>

                Your story

                <div className="rich-editor-wrap">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    placeholder="Start with what you know. Write in your own voice..."
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["blockquote", "link"],
                        ["clean"],
                      ],
                    }}
                    formats={["header", "bold", "italic", "underline", "strike", "list", "bullet", "blockquote", "link"]}
                  />
                </div>

              </label>



              <div className="publish-row">

                <span>

                  <BookOpen size={16} /> Take your time. Your story matters.

                </span>



                <button

                  className="primary-button"

                  disabled={saving || uploadingImage}

                >

                  <Plus size={17} />

                  {uploadingImage
                    ? "Uploading image..."
                    : saving
                      ? (editingBlog ? "Saving..." : "Publishing...")
                      : (editingBlog ? "Save changes" : "Publish story")}

                </button>

              </div>

            </form>

          </section>

        ) : selectedBlog ? (

          <article className="reader-page">

            <button

              className="back-link"

              onClick={() => setSelectedBlog(null)}

            >

              <ArrowLeft size={16} /> All stories

            </button>



            <div className="reader-heading">

              <span className="category-pill">

                {categoryOf(selectedBlog)}

              </span>



              <h1>{selectedBlog.title}</h1>



              <p className="reader-deck">

                {stripHtml(selectedBlog.content || "").slice(0, 220)}

              </p>



              <div className="reader-byline">

                <span className="user-avatar">

                  {authorOf(selectedBlog).slice(0, 1).toUpperCase()}

                </span>



                <div>

                  <strong>{authorOf(selectedBlog)}</strong>

                  <span>{dateOf(selectedBlog)} · 4 min read</span>

                </div>

              </div>

            </div>



            <img

              className="reader-cover"

              src={selectedBlog.coverImage || demoBlogs[0].coverImage}

              alt={selectedBlog.title}

            />



            <div className="reader-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedBlog.content || "") }} />



            {user &&
              String(selectedBlog.author?._id || selectedBlog.author) ===
                String(user.id || user._id) &&
              !String(selectedBlog._id).startsWith("demo-") && (
                <div className="story-owner-actions">
                  <button
                    className="primary-button"
                    onClick={() => startEditing(selectedBlog)}
                  >
                    <PenLine size={16} /> Edit story
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => deleteStory(selectedBlog)}
                  >
                    Delete my story
                  </button>
                </div>
              )}

          </article>

        ) : (

          <section className="story-list-section">

            {loading && (

              <p className="loading-state">Finding stories for you…</p>

            )}



            {featured && !loading && (

              <article className="featured-article">

                <button

                  className="featured-cover"

                  onClick={() => setSelectedBlog(featured)}

                  aria-label={`Read ${featured.title}`}

                >

                  <img

                    src={featured.coverImage || demoBlogs[0].coverImage}

                    alt={featured.title}

                  />

                </button>



                <div className="featured-info">

                  <span className="category-pill">

                    {categoryOf(featured)}

                  </span>



                  <button

                    className="article-title-button"

                    onClick={() => setSelectedBlog(featured)}

                  >

                    <h3>{featured.title}</h3>

                  </button>



                  <p>{stripHtml(featured.content || "").slice(0, 190)}</p>



                  <div className="article-meta">

                    <span className="author-avatar">

                      {authorOf(featured).slice(0, 1).toUpperCase()}

                    </span>

                    <span>{authorOf(featured)}</span>

                    <span className="meta-separator">·</span>

                    <span>{dateOf(featured)}</span>

                    <span className="read-time">

                      <Clock3 size={13} /> 4 min read

                    </span>

                  </div>



                  <button

                    className="continue-link"

                    onClick={() => setSelectedBlog(featured)}

                  >

                    Continue reading <ArrowRight size={15} />

                  </button>

                </div>

              </article>

            )}



            {remaining.length > 0 && (

              <div className="list-heading">

                <h2>More to explore</h2>

                <span>Fresh perspectives, every day</span>

              </div>

            )}



            <div className="story-grid">

              {remaining.map((blog) => (

                <article className="story-card" key={blog._id}>

                  <button

                    className="story-card-image"

                    onClick={() => setSelectedBlog(blog)}

                    aria-label={`Read ${blog.title}`}

                  >

                    <img

                      src={blog.coverImage || demoBlogs[1].coverImage}

                      alt={blog.title}

                    />

                  </button>



                  <div className="story-card-body">

                    <span className="category-pill">

                      {categoryOf(blog)}

                    </span>



                    <button

                      className="article-title-button"

                      onClick={() => setSelectedBlog(blog)}

                    >

                      <h3>{blog.title}</h3>

                    </button>



                    <p>{stripHtml(blog.content || "").slice(0, 115)}</p>



                    <div className="article-meta">

                      <span className="author-avatar">

                        {authorOf(blog).slice(0, 1).toUpperCase()}

                      </span>

                      <span>{authorOf(blog)}</span>

                      <span className="meta-separator">·</span>

                      <span>{dateOf(blog)}</span>

                    </div>

                  </div>

                </article>

              ))}

            </div>



            {!loading && filteredBlogs.length === 0 && (

              <div className="empty-state">

                <Search size={27} />

                <h3>No stories found</h3>

                <p>Try a different search or topic.</p>

                <button

                  onClick={() => {

                    setSearch("");

                    setTopic("For you");

                  }}

                >

                  Clear filters

                </button>

              </div>

            )}

          </section>

        )}



        {!selectedBlog && !editorOpen && (

          <section className="writer-banner" id="about">

            <div className="writer-banner-icon">

              <Feather size={22} />

            </div>



            <div>

              <span className="eyebrow">HAVE SOMETHING TO SAY?</span>

              <h2>Your perspective belongs here.</h2>

              <p>Share what you've learned. Inspire someone else.</p>

            </div>



            <button onClick={startWriting}>

              Write your story <ArrowRight size={16} />

            </button>

          </section>

        )}

      </main>



      <footer className="site-footer">

        <a href="#home" className="wordmark">

          <span className="wordmark-icon">

            <Feather size={18} />

          </span>

          <span>

            ink<span className="wordmark-dot">.</span>space

          </span>

        </a>



        <p>A little space for big ideas.</p>

        <span>Read thoughtfully. Write honestly.</span>

      </footer>

    </div>

  );

}



export default App;