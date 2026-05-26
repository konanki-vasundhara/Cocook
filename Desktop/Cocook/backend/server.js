const express = require('express');
const cors = require('cors');

const app = express();

// -------------------- Middleware --------------------
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// -------------------- Mock Database --------------------

let mock_user = {
    name: "Chef Maria",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBr-R4CUdrwT8T69eJzjL3kOJCtwgE61SMjIlBA2ELGMi67xzfpqpK1X7j0Sri2YAZMbNbIIHW5W2hRV0X7fhHOhNPJ5iUQc9GWclGEx3yLL4aRG3Ut7hqS7F_Y2MRjiJvLX5ufk9-OhKZritSsseR4D5VuYnfi_9JWltntCiku230HZNm8z3HVn9jGVmgmv-XpdaXiMXCCgiIayaOGWoJFLwsL8xwOF3LYvzD2VznFVPaMXdsCrY8Y-b4SEVgDiRzwG089Oorpsdfv"
};

let mock_community_posts = [
    {
        id: 1,
        author: "Chef Alex",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        content: "Just nailed the perfect sourdough crust after 3 weeks of trying!",
        likes: 24,
        comments: 5,
        time: "2h ago",
        isLiked: false
    },
    {
        id: 2,
        author: "Sarah Cooks",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        content: "Looking for quick healthy dinner ideas 🥘",
        likes: 12,
        comments: 18,
        time: "5h ago",
        isLiked: false
    }
];

let mock_feed_posts = [
    {
        id: 1,
        title: "Rustic Tomato Basil Pasta",
        author: "Chef Alex",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
        likes: 245,
        time: "2 hours ago"
    },
    {
        id: 2,
        title: "Spring Garden Salad",
        author: "Sarah Cooks",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        likes: 182,
        time: "5 hours ago"
    }
];

// -------------------- Routes --------------------

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'CoCook Backend Running Successfully 🚀'
    });
});

// User Route
app.get('/api/user', (req, res) => {
    res.json(mock_user);
});

// Feed Route
app.get('/api/feed', (req, res) => {
    res.json(mock_feed_posts);
});

// Community Route
app.get('/api/community', (req, res) => {
    res.json(mock_community_posts);
});

// Create Community Post
app.post('/api/community', (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({
            error: "Content is required"
        });
    }

    const new_post = {
        id: Date.now(),
        author: mock_user.name,
        avatar: mock_user.avatar,
        content,
        likes: 0,
        comments: 0,
        time: "Just now",
        isLiked: false
    };

    mock_community_posts.unshift(new_post);

    res.status(201).json(new_post);
});

// Like / Unlike Post
app.put('/api/community/:post_id/like', (req, res) => {
    const post_id = parseInt(req.params.post_id);

    const post = mock_community_posts.find(
        p => p.id === post_id
    );

    if (!post) {
        return res.status(404).json({
            error: "Post not found"
        });
    }

    if (post.isLiked) {
        post.likes -= 1;
        post.isLiked = false;
    } else {
        post.likes += 1;
        post.isLiked = true;
    }

    res.json(post);
});

// Recipe Generator
app.post('/api/recipe/generate', (req, res) => {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({
            error: "Ingredients array is required"
        });
    }

    setTimeout(() => {
        const ingredients_str = ingredients.join(", ");

        res.json({
            title:
                "Magic " +
                (ingredients.length
                    ? ingredients[0].charAt(0).toUpperCase() +
                      ingredients[0].slice(1)
                    : "Surprise") +
                " Delight",

            description: `A delicious recipe made using: ${ingredients_str}`,

            time: "25 mins",
            difficulty: "Easy",

            image:
                "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80"
        });
    }, 2000);
});

// -------------------- Start Server --------------------

const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CoCook backend running on port ${PORT}`);
});
