import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';

export default function Profile() {
  const { 
    user, 
    setUser, 
    feedPosts, 
    friends, 
    stories 
  } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Novice');
  const [favoriteCuisine, setFavoriteCuisine] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync profile inputs when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setExperienceLevel(user.experience_level || 'Novice');
      setFavoriteCuisine(user.favorite_cuisine || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="pt-32 px-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
          <span className="material-symbols-outlined text-3xl">account_circle</span>
        </div>
        <h2 className="text-headline-lg-mobile text-on-surface font-extrabold">Not Logged In</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">Please sign in to view and edit your chef profile.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-primary-container active:scale-95 transition-transform"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  // Real-time calculated statistics
  const userRecipes = feedPosts.filter(p => p.author === user.name);
  const userStories = stories.filter(s => s.user_id === user.id);

  const handleLogout = () => {
    localStorage.removeItem('cocook_token');
    localStorage.removeItem('cocook_user');
    window.location.href = '/login';
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    const token = localStorage.getItem('cocook_token');
    
    try {
      const res = await fetch(`${API_URL}/api/profile?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          experience_level: experienceLevel,
          favorite_cuisine: favoriteCuisine
        })
      });
      
      const updatedUser = await res.json();
      if (res.ok) {
        setUser(updatedUser);
        localStorage.setItem('cocook_user', JSON.stringify(updatedUser));
        setIsEditing(false);
      } else {
        setErrorMessage(updatedUser.detail || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMessage('Network error, please try again.');
    }
    setIsSaving(false);
  };

  return (
    <>
      {/* Header bar */}
      <header className="fixed top-0 w-full z-40 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl shadow-sm flex justify-between items-center px-container-padding-desktop h-16 mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 overflow-hidden font-bold text-sm">
            {user.avatar ? (
              <img className="w-full h-full object-cover" src={user.avatar} alt="" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">Chef Hub</span>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-1.5 flex items-center justify-center gap-1 rounded-full text-red-500 hover:bg-red-500/10 border border-red-500/20 active:scale-95 transition-all text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Logout</span>
        </button>
      </header>

      <main className="pt-24 px-container-padding-desktop mx-auto space-y-8 pb-32 max-w-screen-md">
        
        {/* Profile Info Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-low border border-outline-variant/20 p-6 rounded-3xl neumorphic-lift animate-fade-in">
          <div className="flex items-center gap-5">
            {/* Avatar block */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-primary-container p-0.5 border border-primary/20 flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-primary text-2xl font-black overflow-hidden shadow-inner">
                {user.avatar ? (
                  <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-lg-mobile text-on-surface font-extrabold">{user.name}</h1>
                <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-primary/25">
                  {user.experience_level || 'Novice'}
                </span>
              </div>
              <p className="text-xs text-outline">{user.email}</p>
              <p className="text-sm text-on-surface-variant font-medium mt-1">
                {user.bio || 'Curating flavors for the digital kitchen'}
              </p>
              
              {user.favorite_cuisine && (
                <div className="flex items-center gap-1 bg-secondary/10 text-secondary text-xs px-2.5 py-1 rounded-xl max-w-fit font-bold border border-secondary/15 mt-2">
                  <span className="material-symbols-outlined text-sm">local_pizza</span>
                  <span>Fav Cuisine: <strong className="text-on-surface">{user.favorite_cuisine}</strong></span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-xs font-bold hover:bg-primary-container active:scale-95 transition-transform flex items-center gap-1 shadow-md self-start md:self-center"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>Edit Profile</span>
          </button>
        </section>

        {/* Real-time Statistics Cards */}
        <section className="grid grid-cols-3 gap-4 animate-fade-in delay-75">
          <div className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-2xl text-center space-y-1 neumorphic-lift">
            <span className="text-primary font-headline-lg font-black text-2xl md:text-3xl leading-none">
              {userRecipes.length}
            </span>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Recipes Shared</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-2xl text-center space-y-1 neumorphic-lift">
            <span className="text-primary font-headline-lg font-black text-2xl md:text-3xl leading-none">
              {userStories.length}
            </span>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Live Stories</p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-2xl text-center space-y-1 neumorphic-lift">
            <span className="text-primary font-headline-lg font-black text-2xl md:text-3xl leading-none">
              {friends.length}
            </span>
            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Foodie Friends</p>
          </div>
        </section>

        {/* Your Active Recipe Posts Section */}
        <section className="space-y-4 animate-fade-in delay-150">
          <div className="flex items-center justify-between">
            <h2 className="font-title-md text-title-md text-on-surface font-extrabold">My Recipes ({userRecipes.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userRecipes.map(recipe => (
              <article key={recipe.id} className="bg-surface-container-low border border-outline-variant/20 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between neumorphic-lift animate-fade-in">
                <div className="relative h-48 w-full bg-black flex items-center justify-center">
                  {recipe.file_type === 'video' ? (
                    <video className="w-full h-full object-cover" src={recipe.image} autoPlay loop muted playsInline />
                  ) : (
                    <img className="w-full h-full object-cover" src={recipe.image} alt={recipe.title} />
                  )}
                  <span className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                    {recipe.time}
                  </span>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-title-md text-on-surface font-extrabold text-base leading-tight">{recipe.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 font-medium">
                    {recipe.content}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {recipe.tags.map(tag => (
                      <span key={tag} className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-[9px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {userRecipes.length === 0 && (
            <div className="text-center py-16 px-4 bg-surface-container-low border border-dashed border-outline-variant rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto animate-pulse">
                <span className="material-symbols-outlined text-2xl font-bold">restaurant_menu</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-title-md text-on-surface font-bold">No shared recipes yet</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                  Share your culinary creations, recipes, or kitchen achievements to fill up your chef portfolio!
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/feed'}
                className="bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-full shadow hover:bg-primary-container active:scale-95 transition-transform"
              >
                Share First Recipe
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center py-8 px-4">
          <div className="bg-surface border border-outline-variant/30 w-full max-w-md rounded-[28px] p-6 shadow-2xl relative animate-scale-up my-auto self-start">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center hover:bg-outline-variant/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-outline">close</span>
            </button>

            <h3 className="font-title-md text-headline-lg-mobile text-on-surface mb-2 font-extrabold">Edit Chef Profile</h3>
            <p className="text-xs text-on-surface-variant mb-6">Modify your cooking details and branding below.</p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveChanges} className="space-y-4">
              {/* Name field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2">Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">person</span>
                  <input 
                    type="text" 
                    className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl border-none text-xs text-on-surface focus:ring-2 focus:ring-primary/20 shadow-inner"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2">Bio / Tagline</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">description</span>
                  <input 
                    type="text" 
                    className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl border-none text-xs text-on-surface focus:ring-2 focus:ring-primary/20 shadow-inner"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
              </div>

              {/* Experience dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2">Cooking Experience</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">restaurant</span>
                  <select 
                    className="w-full h-11 pl-11 pr-8 bg-surface-container-low rounded-xl border-none text-xs text-on-surface focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none"
                    value={experienceLevel}
                    onChange={e => setExperienceLevel(e.target.value)}
                  >
                    <option value="Novice">Novice</option>
                    <option value="Home Cook">Home Cook</option>
                    <option value="Professional Chef">Professional Chef</option>
                    <option value="Master Level">Master Level</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-sm">expand_more</span>
                </div>
              </div>

              {/* Favorite Cuisine */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant ml-2">Favorite Cuisine</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-sm">local_pizza</span>
                  <input 
                    type="text" 
                    className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl border-none text-xs text-on-surface focus:ring-2 focus:ring-primary/20 shadow-inner"
                    value={favoriteCuisine}
                    placeholder="Italian, Indian, Chinese, etc."
                    onChange={e => setFavoriteCuisine(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 border border-outline-variant text-on-surface font-bold text-xs rounded-xl hover:bg-outline-variant/15 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-11 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-75"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
