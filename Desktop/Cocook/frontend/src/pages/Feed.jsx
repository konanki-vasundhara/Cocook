import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Feed() {
  const { 
    user, 
    feedPosts, 
    addFeedPost,
    askAiSuggestion,
    stories, 
    addStory, 
    deleteStory,
    pendingRequests, 
    sentRequests,
    friends, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend,
    searchUsers 
  } = useAppContext();

  // Search/Friends Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Create Story Modal State
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [storyImage, setStoryImage] = useState(''); // Stores URL or Base64
  const [storyFileType, setStoryFileType] = useState('image'); // 'image' or 'video'
  const [activeFilter, setActiveFilter] = useState('none'); // CSS filter style
  const [storyTextOverlay, setStoryTextOverlay] = useState(''); // Text overlay on preview
  const [storyTextColor, setStoryTextColor] = useState('#ffffff');
  const [storyTextBg, setStoryTextBg] = useState('rgba(0,0,0,0.5)');
  const [storyTextY, setStoryTextY] = useState(50); // percentage vertical offset

  // Create Post Modal State
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(''); // Stores URL or Base64
  const [postFileType, setPostFileType] = useState('image'); // 'image' or 'video'
  const [postTags, setPostTags] = useState('');
  const [postTime, setPostTime] = useState('15 mins');

  // Story Playback Slideshow State (Instagram style)
  const [activeStoryGroup, setActiveStoryGroup] = useState(null); // Array of stories currently playing
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);    // Current index in activeStoryGroup
  const [storyProgress, setStoryProgress] = useState(0);

  // Client-side viewed stories state, persisted in localStorage
  const [viewedStories, setViewedStories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cocook_viewed_stories') || '[]');
    } catch {
      return [];
    }
  });

  // Real-time AI suggestion card states
  const [pantryInput, setPantryInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  // CSS Filter Options (Instagram-Style)
  const filterOptions = [
    { name: 'Normal', style: 'none' },
    { name: 'Clarendon', style: 'contrast(1.2) saturate(1.3) brightness(1.1)' },
    { name: 'Lark', style: 'brightness(1.1) saturate(1.2) hue-rotate(-5deg)' },
    { name: 'Vintage', style: 'sepia(0.4) contrast(1.1) saturate(1.2)' },
    { name: 'Juno', style: 'sepia(0.2) saturate(1.3) contrast(1.15) hue-rotate(5deg)' },
    { name: 'Warm', style: 'sepia(0.15) saturate(1.4) brightness(1.05)' },
    { name: 'Cool', style: 'hue-rotate(20deg) saturate(1.1) brightness(0.95) contrast(1.05)' },
    { name: 'Aden', style: 'hue-rotate(-15deg) contrast(0.9) brightness(1.1) saturate(0.85)' },
    { name: 'Monochrome', style: 'grayscale(1) contrast(1.2)' },
    { name: 'Sepia', style: 'sepia(0.85) contrast(0.95) brightness(1.05)' }
  ];

  // Trigger search on query change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (isSearchOpen) {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isSearchOpen]);

  // Story viewed marker helper
  const markStoryAsViewed = (storyId) => {
    if (!storyId) return;
    setViewedStories(prev => {
      if (prev.includes(storyId)) return prev;
      const next = [...prev, storyId];
      localStorage.setItem('cocook_viewed_stories', JSON.stringify(next));
      return next;
    });
  };

  // Story timer
  useEffect(() => {
    let interval;
    if (activeStoryGroup && activeStoryGroup[activeStoryIndex]) {
      const currentStory = activeStoryGroup[activeStoryIndex];
      markStoryAsViewed(currentStory.id);

      setStoryProgress(0);
      interval = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            if (activeStoryIndex + 1 < activeStoryGroup.length) {
              setActiveStoryIndex(prevIdx => prevIdx + 1);
            } else {
              setActiveStoryGroup(null);
              setActiveStoryIndex(0);
            }
            return 0;
          }
          return prev + 2; 
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [activeStoryGroup, activeStoryIndex]);

  // Dynamic AI loading sequence ticks
  useEffect(() => {
    let loaderInterval;
    if (isAiGenerating) {
      setAiStep(0);
      loaderInterval = setInterval(() => {
        setAiStep(prev => {
          if (prev >= 2) {
            clearInterval(loaderInterval);
            return 2;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(loaderInterval);
  }, [isAiGenerating]);

  // Handle local File Upload for Story
  const handleStoryFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setStoryFileType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setStoryImage(reader.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  // Handle local File Upload for Recipe Post
  const handlePostFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setPostFileType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setPostImage(reader.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = async (e) => {
    e.preventDefault();
    if (!storyImage) return alert("Please upload an image or video first!");

    const success = await addStory(storyTextOverlay || storyContent, storyImage, storyFileType, activeFilter);
    if (success) {
      setStoryContent('');
      setStoryImage('');
      setStoryTextOverlay('');
      setActiveFilter('none');
      setIsStoryOpen(false);
    }
    // Error alerts are now handled inside addStory itself
  };

  const handlePostFeed = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return alert("Title and Recipe Details are required.");
    const defaultImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800";
    const imgUrl = postImage.trim() || defaultImg;
    const tagsArr = postTags ? postTags.split(',').map(t => t.trim()) : ['Culinary'];
    
    const success = await addFeedPost({
      title: postTitle,
      content: postContent,
      image: imgUrl,
      file_type: postFileType,
      tags: tagsArr,
      time: postTime
    });
    
    if (success) {
      setPostTitle('');
      setPostContent('');
      setPostImage('');
      setPostTags('');
      setPostTime('15 mins');
      setIsPostOpen(false);
      
      // Post Recipe Create Scroll: smooth scroll to top of feed instantly
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  // Interactive real-time AI Suggestion trigger
  const handleAskAi = async () => {
    setIsAiGenerating(true);
    setGeneratedRecipe(null);
    
    const suggestion = await askAiSuggestion(pantryInput);
    
    // Bounded wait to finish typing loaders
    setTimeout(() => {
      setGeneratedRecipe(suggestion);
      setIsAiGenerating(false);
    }, 3200);
  };

  const handleShareAiRecipe = async () => {
    if (!generatedRecipe) return;
    const success = await addFeedPost({
      title: generatedRecipe.title,
      content: generatedRecipe.content,
      image: generatedRecipe.image_url,
      file_type: 'image',
      tags: generatedRecipe.tags ? generatedRecipe.tags.split(',') : ['AI-Chef'],
      time: generatedRecipe.time_estimate || '15 mins'
    });
    if (success) {
      setGeneratedRecipe(null);
      setPantryInput('');
      
      // Smooth scroll to top of feed instantly
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  // Group stories by user
  const userStoriesMap = {};
  stories.forEach(story => {
    if (!story || !story.user) return; // Skip stories with null/undefined user to prevent crashes
    if (!userStoriesMap[story.user_id]) {
      userStoriesMap[story.user_id] = {
        user: story.user,
        stories: []
      };
    }
    userStoriesMap[story.user_id].stories.push(story);
  });
  
  const groupedStories = Object.values(userStoriesMap);

  // Separate self stories and friends stories
  const selfStoriesGroup = groupedStories.find(g => g.user && String(g.user.id) === String(user?.id));
  const friendsStoriesGroups = groupedStories.filter(g => g.user && String(g.user.id) !== String(user?.id));

  // Helper to check if a user has unviewed stories
  const hasUnviewedStories = (storyList) => {
    return storyList.some(story => !viewedStories.includes(story.id));
  };

  // Play slideshow controls
  const playNextStory = () => {
    if (activeStoryGroup) {
      if (activeStoryIndex + 1 < activeStoryGroup.length) {
        setActiveStoryIndex(prev => prev + 1);
      } else {
        setActiveStoryGroup(null);
        setActiveStoryIndex(0);
      }
    }
  };

  const playPrevStory = () => {
    if (activeStoryGroup) {
      if (activeStoryIndex > 0) {
        setActiveStoryIndex(prev => prev - 1);
      }
    }
  };

  const activeStory = activeStoryGroup ? activeStoryGroup[activeStoryIndex] : null;

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-40 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-container-padding-desktop left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high p-0.5 border border-primary/20 overflow-hidden">
            <img 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover" 
              src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'}
            />
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">CoCook</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Friends/Add icon button */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all active:scale-95 relative"
          >
            <span className="material-symbols-outlined text-2xl">person_add</span>
            {pendingRequests.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mt-20 px-container-padding-desktop space-y-8 pb-32 max-w-screen-md mx-auto">
        
        {/* Stories Section */}
        <section className="space-y-4">
          <h2 className="font-title-md text-title-md text-on-surface">Recent Stories</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide items-center">
            
            {/* 1. Self Story Circle (Instagram style) */}
            {selfStoriesGroup ? (
              <div className="flex-shrink-0 flex flex-col items-center gap-2 relative animate-fade-in">
                <button 
                  onClick={() => {
                    setActiveStoryGroup(selfStoriesGroup.stories);
                    setActiveStoryIndex(0);
                  }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    hasUnviewedStories(selfStoriesGroup.stories) 
                      ? 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[2.5px]' 
                      : 'bg-outline-variant p-[1.5px]'
                  } hover:scale-105 transition-transform duration-200`}
                >
                  <div className="w-full h-full rounded-full bg-surface p-[2px] overflow-hidden">
                    <img 
                      alt="Your Story" 
                      className="w-full h-full rounded-full object-cover" 
                      src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'}
                    />
                  </div>
                </button>
                <button 
                  onClick={() => setIsStoryOpen(true)}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-white rounded-full border-2 border-surface flex items-center justify-center active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                </button>
                <span className="font-label-md text-label-md text-on-surface-variant">Your Story</span>
              </div>
            ) : (
              <button 
                onClick={() => setIsStoryOpen(true)}
                className="flex-shrink-0 flex flex-col items-center gap-2 outline-none border-none bg-transparent"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary hover:scale-105 transition-transform duration-200 relative bg-primary/5">
                  <img 
                    alt="Add Story" 
                    className="w-12 h-12 rounded-full object-cover opacity-60" 
                    src={user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'}
                  />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-surface flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                  </div>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant">Your Story</span>
              </button>
            )}

            {/* 2. Friends' Stories Circles */}
            {friendsStoriesGroups.map(g => {
              const active = hasUnviewedStories(g.stories);
              return (
                <button 
                  key={g.user.id}
                  onClick={() => {
                    setActiveStoryGroup(g.stories);
                    setActiveStoryIndex(0);
                  }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 outline-none border-none bg-transparent hover:scale-105 transition-transform"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    active 
                      ? 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-[2.5px]' 
                      : 'bg-outline-variant p-[1.5px]'
                  }`}>
                    <div className="w-full h-full rounded-full bg-surface p-[2px] overflow-hidden">
                      <img 
                        alt={g.user.name} 
                        className="w-full h-full rounded-full object-cover" 
                        src={g.user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'}
                      />
                    </div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant truncate w-16">{g.user.name}</span>
                </button>
              );
            })}

            {friendsStoriesGroups.length === 0 && !selfStoriesGroup && (
              <span className="text-sm text-outline-variant italic ml-2">No active stories</span>
            )}
          </div>
        </section>

        {/* --- DYNAMIC AI SUGGESTION CARD --- */}
        <section className="bg-surface-container-low rounded-[32px] p-6 border border-white/40 shadow-lg relative overflow-hidden flex flex-col gap-4 animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-primary-fixed-dim relative z-10 animate-bounce">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div className="flex-1 relative z-10">
              <p className="font-label-md text-label-md text-secondary uppercase tracking-wider font-bold">Real-time AI Chef Suggestions</p>
              <h3 className="font-title-md text-title-md text-on-surface">Enter ingredients to generate an authentic recipe instantly!</h3>
            </div>
          </div>

          {/* Pantry Input Field */}
          <div className="relative flex gap-2">
            <input 
              type="text" 
              className="flex-1 h-12 px-4 bg-surface-container rounded-2xl text-on-surface placeholder:text-outline border-none focus:ring-2 focus:ring-primary/20 shadow-inner"
              placeholder="e.g. egg, baby spinach, tomato, basil..."
              value={pantryInput}
              onChange={e => setPantryInput(e.target.value)}
              disabled={isAiGenerating}
            />
            <button 
              onClick={handleAskAi}
              disabled={isAiGenerating || !pantryInput.trim()}
              className="h-12 px-5 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <span>{isAiGenerating ? 'Crafting...' : 'Generate'}</span>
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
            </button>
          </div>

          {/* Dynamic AI Loading Sequences */}
          {isAiGenerating && (
            <div className="py-4 flex items-center gap-3 bg-surface-container-high/40 p-4 rounded-2xl animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="text-sm font-medium text-primary">
                {aiStep === 0 && "🧐 Scanning your virtual pantry..."}
                {aiStep === 1 && "💡 Thinking up optimal flavor dynamics..."}
                {aiStep === 2 && "🍳 Plating your customized Chef suggestion..."}
              </span>
            </div>
          )}

          {/* Generated Suggestion Result */}
          {generatedRecipe && !isAiGenerating && (
            <div className="mt-2 bg-surface-container-lowest/80 backdrop-blur-md p-5 rounded-2xl border border-primary/25 space-y-4 animate-scale-up shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-secondary/15 text-secondary text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {generatedRecipe.difficulty} • {generatedRecipe.time_estimate}
                  </span>
                  <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold mt-2 text-primary">{generatedRecipe.title}</h4>
                </div>
                <img className="w-16 h-16 rounded-xl object-cover border border-outline/10 shadow-sm" src={generatedRecipe.image_url} alt="" />
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed font-medium italic">"{generatedRecipe.content}"</p>
              
              <div className="flex gap-2 justify-end pt-2 border-t border-outline-variant/10">
                <button 
                  onClick={() => setGeneratedRecipe(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container active:scale-95 transition-transform"
                >
                  Clear
                </button>
                <button 
                  onClick={handleShareAiRecipe}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-md hover:bg-secondary-container"
                >
                  <span className="material-symbols-outlined text-sm">share</span> Share to Feed
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Feed Section */}
        <section className="space-y-8">
          {feedPosts.map(post => (
            <article key={post.id} className="neumorphic-lift rounded-[32px] overflow-hidden border border-white/20 bg-surface-container-lowest animate-fade-in">
              <div className="relative h-80">
                {post.file_type === 'video' ? (
                  <video 
                    className="w-full h-full object-cover" 
                    src={post.image} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    style={{ filter: post.filter_style || 'none' }}
                  />
                ) : (
                  <img 
                    className="w-full h-full object-cover" 
                    src={post.image} 
                    alt={post.title} 
                    style={{ filter: post.filter_style || 'none' }}
                  />
                )}
                <div className="absolute top-4 right-4 bg-surface/60 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/40">
                  <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">{post.time}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <img className="w-6 h-6 rounded-full object-cover border border-outline/20" src={post.authorAvatar} alt={post.author} />
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">by {post.author}</span>
                    </div>
                  </div>
                  <button className="neumorphic-icon-btn w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">bookmark</span>
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">{post.content}</p>
                
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="bg-surface-container-low text-on-secondary-fixed-variant px-3 py-1 rounded-full font-label-md text-label-md font-medium">#{tag}</span>
                  ))}
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-transform">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                      <span className="font-label-md text-label-md">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-transform">
                      <span className="material-symbols-outlined text-xl">chat_bubble</span>
                      <span className="font-label-md text-label-md">{post.comments}</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      const shareText = `🍳 ${post.title}\nby ${post.author}\n\n${post.content}\n\n#CoCook`;
                      if (navigator.share) {
                        navigator.share({ title: post.title, text: shareText }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(shareText).then(() => {
                          alert('Recipe copied to clipboard!');
                        }).catch(() => {
                          alert('Could not share this recipe.');
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-xl">share</span>
                  </button>
                </div>
              </div>
            </article>
          ))}

          {feedPosts.length === 0 && (
            <div className="text-center py-16 px-4 bg-surface-container-low rounded-[24px] border border-dashed border-outline-variant animate-fade-in">
              <span className="material-symbols-outlined text-5xl text-outline-variant">restaurant_menu</span>
              <p className="mt-4 text-on-surface-variant font-title-md font-bold">Your feed is clean and dynamic.</p>
              <p className="text-sm text-outline-variant mt-1">Connect with friends or post your own culinary stories and recipes to get started!</p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Post Button */}
      <button 
        onClick={() => setIsPostOpen(true)}
        className="fixed bottom-24 right-6 md:right-12 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center z-30 active:scale-90 transition-all duration-200 shadow-xl hover:bg-primary-container hover:text-on-primary-container animate-bounce"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>


      {/* --- MODAL: INSTAGRAM-STYLE MULTI-STORY VIEWER SLIDESHOW --- */}
      {activeStoryGroup && activeStoryGroup[activeStoryIndex] && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 text-white animate-fade-in">
          
          {/* Multi-story Segment Progress Bars at Top */}
          <div className="w-full flex gap-1.5 absolute top-4 left-0 right-0 px-4 z-20">
            {activeStoryGroup.map((story, idx) => {
              let width = "0%";
              if (idx < activeStoryIndex) width = "100%";
              else if (idx === activeStoryIndex) width = `${storyProgress}%`;
              
              return (
                <div key={story.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-75"
                    style={{ width }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* User Info and Controls */}
          <div className="flex justify-between items-center w-full mt-4 z-10">
            <div className="flex items-center gap-3">
              <img 
                className="w-10 h-10 rounded-full object-cover border border-white/20" 
                src={activeStoryGroup[activeStoryIndex].user.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'} 
                alt={activeStoryGroup[activeStoryIndex].user.name} 
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">{activeStoryGroup[activeStoryIndex].user.name}</span>
                <span className="text-[10px] text-white/60">
                  {new Date(activeStoryGroup[activeStoryIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeStoryGroup[activeStoryIndex].user.id === user.id && (
                <button 
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this story?")) {
                      const deletedId = activeStoryGroup[activeStoryIndex].id;
                      const success = await deleteStory(deletedId);
                      if (success) {
                        if (activeStoryGroup.length > 1) {
                          const newGroup = activeStoryGroup.filter(s => s.id !== deletedId);
                          setActiveStoryGroup(newGroup);
                          if (activeStoryIndex >= newGroup.length) {
                            setActiveStoryIndex(newGroup.length - 1);
                          }
                        } else {
                          setActiveStoryGroup(null);
                          setActiveStoryIndex(0);
                        }
                      }
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-white active:scale-90 transition-all border border-red-500/30"
                  title="Delete Story"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              )}
              <button 
                onClick={() => {
                  setActiveStoryGroup(null);
                  setActiveStoryIndex(0);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Story Slideshow Center Content (Tap Left/Right to Navigate) */}
          <div className="flex-1 flex items-center justify-center my-6 relative w-full max-w-lg mx-auto">
            {/* Left Tap Target */}
            <div 
              onClick={playPrevStory}
              className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
            ></div>
            
            {/* Right Tap Target */}
            <div 
              onClick={playNextStory}
              className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer"
            ></div>

            {/* Story View */}
            <div className="w-full flex flex-col justify-center items-center relative z-0">
              {activeStoryGroup[activeStoryIndex].image_url ? (
                activeStoryGroup[activeStoryIndex].file_type === 'video' ? (
                  <video 
                    className="max-h-[65vh] w-full object-contain rounded-3xl shadow-2xl border border-white/15" 
                    src={activeStoryGroup[activeStoryIndex].image_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    style={{ filter: activeStoryGroup[activeStoryIndex].filter_style || 'none' }}
                  />
                ) : (
                  <img 
                    className="max-h-[65vh] w-full object-contain rounded-3xl shadow-2xl border border-white/15" 
                    src={activeStoryGroup[activeStoryIndex].image_url} 
                    alt="Story content" 
                    style={{ filter: activeStoryGroup[activeStoryIndex].filter_style || 'none' }}
                  />
                )
              ) : null}
              {activeStoryGroup[activeStoryIndex].content && (
                <div className="mt-4 px-6 py-4 glass-card bg-black/50 text-center rounded-2xl w-full max-w-[90%] border border-white/10">
                  <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-white">
                    "{activeStoryGroup[activeStoryIndex].content}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Time */}
          <div className="text-center text-white/50 text-xs mb-4">
            Story {activeStoryIndex + 1} of {activeStoryGroup.length} • Tap sides of screen to navigate
          </div>
        </div>
      )}


      {/* --- MODAL: SEARCH & FRIENDS MANAGEMENT --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center py-8 px-4">
          <div className="bg-surface dark:bg-surface-dim w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-outline-variant/30 flex flex-col max-h-[80vh] overflow-hidden animate-scale-up my-auto self-start">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Connect with Friends</h3>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input 
                className="w-full h-12 pl-12 pr-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                placeholder="Search chef name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              
              {/* 1. Pending Received Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-title-md text-primary font-bold">Pending Friend Requests ({pendingRequests.length})</h4>
                  <div className="space-y-2">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-2xl border border-primary/10 animate-fade-in">
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-full object-cover" src={req.sender.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'} alt="" />
                          <div>
                            <span className="font-bold text-on-surface truncate max-w-[150px] block leading-tight">{req.sender.name}</span>
                            <span className="text-[10px] text-outline">Wants to connect</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => acceptFriendRequest(req.id)}
                            className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => rejectFriendRequest(req.id)}
                            className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-full text-xs font-bold border border-outline-variant/30 hover:bg-surface-variant active:scale-95 transition-all"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. My Friends */}
              {!searchQuery && friends.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-title-md text-secondary font-bold">My Friends ({friends.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {friends.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-secondary/10 animate-fade-in">
                        <div className="flex items-center gap-3">
                          <img className="w-10 h-10 rounded-full object-cover" src={f.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'} alt="" />
                          <div>
                            <p className="font-bold text-on-surface leading-none">{f.name}</p>
                            <p className="text-[10px] text-outline mt-1 truncate max-w-[150px]">{f.bio}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Disconnect from ${f.name}?`)) {
                              removeFriend(f.id);
                            }
                          }}
                          className="bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-600 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-red-500/20 active:scale-95"
                        >
                          Disconnect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. User Search Results / Recommendations */}
              <div className="space-y-3">
                <h4 className="font-title-md text-on-surface font-bold">
                  {searchQuery ? 'Search Results' : 'Suggested Chefs'}
                </h4>
                <div className="space-y-2">
                  {searchResults
                    .filter(u => u.id !== user.id)
                    .map(u => {
                      const isFriend = friends.some(f => f.id === u.id);
                      const isPendingReceived = pendingRequests.some(r => r.sender.id === u.id);
                      const receivedReq = pendingRequests.find(r => r.sender.id === u.id);
                      const isPendingSent = sentRequests.some(r => r.receiver.id === u.id);

                      return (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 animate-fade-in">
                          <div className="flex items-center gap-3">
                            <img className="w-10 h-10 rounded-full object-cover" src={u.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv'} alt="" />
                            <div>
                              <p className="font-bold text-on-surface leading-none">{u.name}</p>
                              <p className="text-[10px] text-outline mt-1 truncate max-w-[180px]">{u.bio}</p>
                            </div>
                          </div>
                          
                          {isFriend ? (
                            <span className="text-xs text-secondary font-bold bg-secondary/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">done</span> Connected
                            </span>
                          ) : isPendingReceived ? (
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => acceptFriendRequest(receivedReq.id)}
                                className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => rejectFriendRequest(receivedReq.id)}
                                className="bg-surface-container-high text-on-surface-variant px-2.5 py-1.5 rounded-full text-xs font-bold border border-outline-variant/30 hover:bg-surface-variant active:scale-95 transition-all"
                              >
                                Ignore
                              </button>
                            </div>
                          ) : isPendingSent ? (
                            <span className="text-xs text-outline font-bold bg-surface-container-high/60 px-3 py-1.5 rounded-full flex items-center gap-1 border border-outline-variant/20">
                              <span className="material-symbols-outlined text-sm animate-pulse">hourglass_empty</span> Requested
                            </span>
                          ) : (
                            <button 
                              onClick={() => sendFriendRequest(u.id)}
                              className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">add</span> Connect
                            </button>
                          )}
                        </div>
                      );
                    })}

                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-xs text-outline italic text-center py-4">No chefs found matching "{searchQuery}"</p>
                  )}
                  {!searchQuery && searchResults.length === 0 && (
                    <p className="text-xs text-outline italic text-center py-4">No suggested chefs found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- MODAL: CREATE STORY (INSTAGRAM UPLOAD & CSS FILTER EDITING) --- */}
      {isStoryOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center py-8 px-4">
          <form 
            onSubmit={handlePostStory}
            className="bg-surface dark:bg-surface-dim w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-none overflow-visible animate-scale-up my-auto self-start"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Add to Your Story</h3>
              <button 
                type="button"
                onClick={() => {
                  setStoryImage('');
                  setStoryTextOverlay('');
                  setActiveFilter('none');
                  setIsStoryOpen(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* File Upload Selector */}
            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant ml-2 font-bold">Upload Culinary Image/Video</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-primary">
                    <span className="material-symbols-outlined text-3xl mb-1">cloud_upload</span>
                    <p className="text-xs font-semibold">Click to upload photo or video</p>
                    <p className="text-[10px] text-outline mt-1">Supports PNG, JPG, MP4, MOV</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleStoryFileChange}
                  />
                </label>
              </div>
            </div>

            {/* LIVE PREVIEW BOX WITH FILTERS & TEXT OVERLAYS */}
            {storyImage && (
              <div className="space-y-4">
                <span className="font-label-md text-on-surface-variant ml-2 font-bold">Preview & Edit (Instagram Filter Style)</span>
                
                {/* Preview Container */}
                <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-md bg-black border border-outline-variant/30 flex items-center justify-center">
                  
                  {/* Media View */}
                  {storyFileType === 'video' ? (
                    <video 
                      className="w-full h-full object-contain" 
                      src={storyImage} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      style={{ filter: activeFilter }}
                    />
                  ) : (
                    <img 
                      className="w-full h-full object-contain" 
                      src={storyImage} 
                      alt="Story preview" 
                      style={{ filter: activeFilter }}
                    />
                  )}

                  {/* Dynamic Text Overlay Rendering */}
                  {storyTextOverlay && (
                    <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none p-4">
                      <div 
                        className="px-4 py-2 rounded-xl text-center font-bold shadow-lg pointer-events-auto break-words"
                        style={{ 
                          color: storyTextColor, 
                          backgroundColor: storyTextBg,
                          transform: `translateY(${(storyTextY - 50) * 3}px)`,
                          maxWidth: '90%',
                          fontSize: '18px'
                        }}
                      >
                        {storyTextOverlay}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical Text Drag/Position Slider */}
                {storyTextOverlay && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-on-surface-variant px-1 font-bold">
                      <span>Position Text Vertically</span>
                      <span>{storyTextY}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      className="w-full accent-primary h-1 bg-surface-container rounded-lg"
                      value={storyTextY}
                      onChange={e => setStoryTextY(parseInt(e.target.value))}
                    />
                  </div>
                )}

                {/* Interactive Horizontal Scrollable Filter Select */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-on-surface-variant ml-1">Swipe & Apply Filters</span>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setActiveFilter(opt.style)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-1 ${
                          activeFilter === opt.style ? 'scale-105 font-bold text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        <div 
                          className="w-12 h-12 rounded-full border-2 border-surface shadow-sm overflow-hidden flex items-center justify-center bg-zinc-800"
                          style={{ filter: opt.style }}
                        >
                          <img className="w-full h-full object-cover opacity-60" src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100" alt="" />
                        </div>
                        <span className="text-[10px] truncate w-14 text-center">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Text Overlay Inputs */}
                <div className="space-y-3 p-3 bg-surface-container rounded-2xl border border-outline-variant/20">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant">Add Text on Story (Sticker style)</label>
                    <input 
                      type="text"
                      className="w-full h-10 px-3 bg-surface rounded-xl border-none text-sm text-on-surface placeholder:text-outline"
                      placeholder="Type text overlay..."
                      value={storyTextOverlay}
                      onChange={e => setStoryTextOverlay(e.target.value)}
                    />
                  </div>
                  {storyTextOverlay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-outline">Text Color</label>
                        <select 
                          className="w-full h-8 bg-surface rounded-lg text-xs border-none"
                          value={storyTextColor}
                          onChange={e => setStoryTextColor(e.target.value)}
                        >
                          <option value="#ffffff">White</option>
                          <option value="#000000">Black</option>
                          <option value="#ffeb3b">Yellow</option>
                          <option value="#e91e63">Pink</option>
                          <option value="#00e676">Green</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-outline">Background Color</label>
                        <select 
                          className="w-full h-8 bg-surface rounded-lg text-xs border-none"
                          value={storyTextBg}
                          onChange={e => setStoryTextBg(e.target.value)}
                        >
                          <option value="rgba(0,0,0,0.5)">Dark Shadow</option>
                          <option value="rgba(255,255,255,0.8)">Light Shadow</option>
                          <option value="#9f4118">Warm Chef</option>
                          <option value="transparent">No Background</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!storyImage}
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:bg-primary-container active:scale-95 transition-all mt-2 disabled:opacity-50"
            >
              Share to Story
            </button>
          </form>
        </div>
      )}


      {/* --- MODAL: CREATE FEED POST (RECIPE) --- */}
      {isPostOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto flex justify-center py-8 px-4">
          <form 
            onSubmit={handlePostFeed}
            className="bg-surface dark:bg-surface-dim w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-none overflow-visible animate-scale-up my-auto self-start"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Post New Recipe</h3>
              <button 
                type="button"
                onClick={() => {
                  setPostImage('');
                  setIsPostOpen(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-on-surface-variant active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant ml-2 font-bold">Recipe Title</label>
              <input 
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                placeholder="e.g. Handmade Fettuccine Carbonara"
                required
                value={postTitle}
                onChange={e => setPostTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant ml-2 font-bold">How to Cook (Recipe Details)</label>
              <textarea 
                className="w-full p-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                placeholder="List the steps, ingredients, or cooking guide..."
                required
                rows="4"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant ml-2 font-bold">Cooking Time</label>
                <input 
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                  placeholder="e.g. 25 mins"
                  value={postTime}
                  onChange={e => setPostTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant ml-2 font-bold">Tags (Comma Sep)</label>
                <input 
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline"
                  placeholder="e.g. Italian, Pasta, Dinner"
                  value={postTags}
                  onChange={e => setPostTags(e.target.value)}
                />
              </div>
            </div>

            {/* Unified Upload Photo / Video for Recipe */}
            <div className="space-y-2">
              <label className="font-label-md text-on-surface-variant ml-2 font-bold">Upload Recipe Photo / Video</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2 text-primary">
                    <span className="material-symbols-outlined text-2xl mb-0.5">photo_camera</span>
                    <p className="text-[10px] font-semibold">Select recipe image or video file</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handlePostFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Post Media Preview */}
            {postImage && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-black border border-outline-variant/30 flex items-center justify-center">
                {postFileType === 'video' ? (
                  <video className="w-full h-full object-contain" src={postImage} autoPlay loop muted playsInline />
                ) : (
                  <img className="w-full h-full object-contain" src={postImage} alt="" />
                )}
              </div>
            )}

            <button 
              type="submit"
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:bg-primary-container active:scale-95 transition-all mt-2"
            >
              Post Recipe
            </button>
          </form>
        </div>
      )}
    </>
  );
}
