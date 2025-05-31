const ForumPost = require('../models/ForumPost');
const User = require('../models/User');

// Listar posts do fórum
exports.getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search, 
      sortBy = 'lastActivity',
      order = 'desc' 
    } = req.query;

    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Pesquisa por texto
    if (search) {
      filter.$text = { $search: search };
    }

    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    // Posts fixos primeiro, depois ordenação normal
    const posts = await ForumPost.find(filter)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('replies.author', 'username firstName lastName profilePicture')
      .sort({ isSticky: -1, ...sortOptions })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ForumPost.countDocuments(filter);

    // Adicionar estatísticas para cada post
    const postsWithStats = posts.map(post => {
      const postObj = post.toObject();
      postObj.likesCount = post.likes.length;
      postObj.repliesCount = post.replies.filter(reply => !reply.isDeleted).length;
      postObj.lastReply = post.replies.length > 0 ? 
        post.replies[post.replies.length - 1] : null;
      
      // Verificar se o utilizador atual deu like
      if (req.user) {
        postObj.isLikedByUser = post.likes.some(
          like => like.user.toString() === req.user.userId.toString()
        );
      }
      
      return postObj;
    });

    res.json({
      success: true,
      posts: postsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao obter posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter posts do fórum',
      error: error.message
    });
  }
};

// Obter post específico
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findById(postId)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('replies.author', 'username firstName lastName profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    // Incrementar visualizações
    await post.incrementViews();

    const postObj = post.toObject();
    postObj.likesCount = post.likes.length;
    postObj.repliesCount = post.replies.filter(reply => !reply.isDeleted).length;
    
    if (req.user) {
      postObj.isLikedByUser = post.likes.some(
        like => like.user.toString() === req.user.userId.toString()
      );
    }

    res.json({
      success: true,
      post: postObj
    });
  } catch (error) {
    console.error('Erro ao obter post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter post',
      error: error.message
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { title, content, category, tags } = req.body;

    // Validação manual com logs
    if (!title) {
      console.log('Erro: Título em falta');
      return res.status(400).json({
        success: false,
        message: 'Título é obrigatório'
      });
    }

    if (!content) {
      console.log('Erro: Conteúdo em falta');
      return res.status(400).json({
        success: false,
        message: 'Conteúdo é obrigatório'
      });
    }

    console.log('Dados válidos, criando post...');

    const post = new ForumPost({
      title: title.trim(),
      content: content.trim(),
      author: req.user.userId,
      category: category || 'geral',
      tags: Array.isArray(tags) ? tags : []
    });

    console.log('Post object:', post);

    await post.save();
    console.log('Post salvo com sucesso');
    
    const populatedPost = await ForumPost.findById(post._id)
      .populate('author', 'username firstName lastName profilePicture');

    console.log('Post populado:', populatedPost);

    res.status(201).json({
      success: true,
      message: 'Post criado com sucesso',
      post: populatedPost
    });
  } catch (error) {
    console.error('=== ERRO CREATE POST ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar post',
      error: error.message,
      details: error.errors ? Object.keys(error.errors) : null
    });
  }
};


// Adicionar resposta
exports.addReply = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo da resposta é obrigatório'
      });
    }

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    if (post.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Este post está bloqueado para novas respostas'
      });
    }

    await post.addReply(content, req.user.userId);

    const updatedPost = await ForumPost.findById(postId)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('replies.author', 'username firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Resposta adicionada com sucesso',
      post: updatedPost
    });
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar resposta',
      error: error.message
    });
  }
};

// Like/Unlike post
exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    await post.like(req.user.userId);

    const isLiked = post.likes.some(
      like => like.user.toString() === req.user.userId.toString()
    );

    res.json({
      success: true,
      message: isLiked ? 'Like adicionado' : 'Like removido',
      isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Erro ao dar like:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar like',
      error: error.message
    });
  }
};

// Obter estatísticas do fórum
exports.getForumStats = async (req, res) => {
  try {
    const [totalPosts, totalReplies, categories] = await Promise.all([
      ForumPost.countDocuments(),
      ForumPost.aggregate([
        { $project: { repliesCount: { $size: '$replies' } } },
        { $group: { _id: null, total: { $sum: '$repliesCount' } } }
      ]),
      ForumPost.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalPosts,
        totalReplies: totalReplies[0]?.total || 0,
        categoriesStats: categories
      }
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do fórum',
      error: error.message
    });
  }
};

// Eliminar post (só autor ou admin)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post não encontrado'
      });
    }

    // Verificar se o utilizador pode eliminar
    const user = await User.findById(req.user.userId);
    if (post.author.toString() !== req.user.userId.toString() && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Não tens permissão para eliminar este post'
      });
    }

    post.isDeleted = true;
    await post.save();

    res.json({
      success: true,
      message: 'Post eliminado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao eliminar post:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao eliminar post',
      error: error.message
    });
  }
};
