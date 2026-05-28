const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// --- Mock Database ---
let mock_user = {
    "name": "Chef Maria",
    "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv"
};

let mock_community_posts = [
    {
        "id": 1,
        "author": "Chef Alex",
        "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuAbbT6OEj_N9j9YtaIA6laMB8VGYZmmZ-5j1HGSScrdFOKoqzhTbmKNGqrt4FPJcucAesPIqtzGZzY6I7gDSob6rsK9YLtOmEfxFqQWzIHEiDp7-vKKkEn-6If9oDR8c0O8ONAHzPkwwBKCr-8iKwAvQMGbZNql_lmHrxtOzFSGml9KrHtt4p4XHa5WyxFm6cF0VVXI-e7zHWNiZEAxZXeErO8jFo1PzOJ9qdAAzIgWawWdiW1t2U2_usVDO2-D6A4Nx9Li3wZFM0vZ",
        "content": "Just nailed the perfect sourdough crust after 3 weeks of trying! The secret is in the hydration ratio. Anyone else baking this weekend?",
        "likes": 24,
        "comments": 5,
        "time": "2h ago",
        "isLiked": false
    },
    {
        "id": 2,
        "author": "Sarah Cooks",
        "avatar": "https://lh3.googleusercontent.com/aida-public/AB6AXuB2M-6-R38Xo7tJtQ178v8s4Q8R7tL5W8PZ5sW7-QOQvR8XWpX8kQO4-N2Z_kH7rT7u5w5tQv5R8X5QkQ4-Q8X5wP5sW7-QOQvR8XWpX8kQO4-N2Z_kH7rT7u5w5tQv5R8X5QkQ4-Q8X5wP5sW7-QOQvR8XWpX8kQO4-N2Z_kH7rT7u5w5tQv5R8X5QkQ4-Q8X5wP5sW7-QOQvR8XWpX8kQO4-N2Z_kH7rT7u5w5tQv5R8X5",
        "content": "Looking for some quick 15-minute dinner ideas that are actually healthy. Feeling uninspired today. Help! 🥘",
        "likes": 12,
        "comments": 18,
        "time": "5h ago",
        "isLiked": false
    }
];

let mock_feed_posts = [
    {
        "id": 1,
        "title": "Rustic Tomato Basil Pasta",
        "author": "Chef Alex",
        "image": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
        "likes": 245,
        "time": "2 hours ago"
    },
    {
        "id": 2,
        "title": "Spring Garden Salad",
        "author": "Sarah Cooks",
        "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        "likes": 182,
        "time": "5 hours ago"
    }
];

// Routes
app.get('/api/user', (req, res) => res.json(mock_user));
app.get('/api/feed', (req, res) => res.json(mock_feed_posts));
app.get('/api/community', (req, res) => res.json(mock_community_posts));

app.post('/api/community', (req, res) => {
    const { content } = req.body;
    const new_post = {
        id: Date.now(),
        author: mock_user.name,
        avatar: mock_user.avatar,
        content: content,
        likes: 0,
        comments: 0,
        time: "Just now",
        isLiked: false
    };
    mock_community_posts.unshift(new_post);
    res.json(new_post);
});

app.put('/api/community/:post_id/like', (req, res) => {
    const post_id = parseInt(req.params.post_id);
    const post = mock_community_posts.find(p => p.id === post_id);
    if (!post) return res.status(404).json({ detail: "Post not found" });
    
    if (post.isLiked) {
        post.likes -= 1;
        post.isLiked = false;
    } else {
        post.likes += 1;
        post.isLiked = true;
    }
    res.json(post);
});

app.post('/api/recipe/generate', (req, res) => {
    const { ingredients } = req.body;
    setTimeout(() => {
        const ingredients_str = ingredients.join(", ");
        res.json({
            title: "Magic " + (ingredients.length ? ingredients[0].charAt(0).toUpperCase() + ingredients[0].slice(1) : "Surprise") + " Delight",
            description: `A delightful and easy-to-make dish perfectly crafted using your available ingredients: ${ingredients_str}.`,
            time: "25 mins",
            difficulty: "Easy",
            image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80"
        });
    }, 2000);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Server running on port ${PORT}`);
});
