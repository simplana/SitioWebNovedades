import React, { useState } from 'react';
import { User, ThumbsUp, Star } from 'lucide-react';
import StarRating from './StarRating';

interface Comment {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  userHelpful: boolean;
}

interface ProductCommentsProps {
  productId: string;
  productName: string;
}

const ProductComments: React.FC<ProductCommentsProps> = ({ productId, productName }) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userName: 'María González',
      rating: 5,
      comment: 'Excelente producto, muy buena calidad. Lo recomiendo totalmente para la decoración del hogar cristiano.',
      date: '15 de Diciembre, 2024',
      helpful: 12,
      userHelpful: false
    },
    {
      id: '2',
      userName: 'Carlos Mendoza',
      rating: 4,
      comment: 'Muy buen producto, llegó en perfectas condiciones. El material es resistente y la imagen es muy clara.',
      date: '10 de Diciembre, 2024',
      helpful: 8,
      userHelpful: false
    },
    {
      id: '3',
      userName: 'Ana Rodríguez',
      rating: 5,
      comment: 'Hermoso crucifijo, perfecto para mi altar personal. La atención al cliente fue excelente.',
      date: '5 de Diciembre, 2024',
      helpful: 15,
      userHelpful: true
    }
  ]);

  const [newComment, setNewComment] = useState({
    rating: 5,
    comment: '',
    userName: ''
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.comment.trim() && newComment.userName.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userName: newComment.userName,
        rating: newComment.rating,
        comment: newComment.comment,
        date: new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        helpful: 0,
        userHelpful: false
      };
      
      setComments([comment, ...comments]);
      setNewComment({ rating: 5, comment: '', userName: '' });
    }
  };

  const handleHelpful = (commentId: string) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            helpful: comment.userHelpful ? comment.helpful - 1 : comment.helpful + 1,
            userHelpful: !comment.userHelpful 
          }
        : comment
    ));
  };

  const averageRating = comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: comments.filter(comment => comment.rating === rating).length,
    percentage: (comments.filter(comment => comment.rating === rating).length / comments.length) * 100
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="font-playfair text-2xl font-bold text-navy mb-6">
        Opiniones de clientes
      </h3>

      {/* Resumen de calificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
        <div className="text-center">
          <div className="text-4xl font-bold text-gold mb-2">
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="lg" />
          <p className="text-gray-600 mt-2">
            Basado en {comments.length} opiniones
          </p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de comentarios */}
      <div className="space-y-6 mb-8">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-start space-x-4">
              <div className="bg-gold p-2 rounded-full">
                <User className="h-5 w-5 text-navy" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-navy">{comment.userName}</h4>
                  <span className="text-sm text-gray-500">{comment.date}</span>
                </div>
                <StarRating rating={comment.rating} size="sm" />
                <p className="text-gray-700 mt-3 leading-relaxed">
                  {comment.comment}
                </p>
                <button
                  onClick={() => handleHelpful(comment.id)}
                  className={`mt-3 flex items-center space-x-2 text-sm transition-colors duration-200 ${
                    comment.userHelpful 
                      ? 'text-gold' 
                      : 'text-gray-500 hover:text-gold'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Útil ({comment.helpful})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario para nueva opinión */}
      <div className="border-t pt-8">
        <h4 className="font-playfair text-xl font-semibold text-navy mb-4">
          Comparte tu opinión
        </h4>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre
              </label>
              <input
                type="text"
                value={newComment.userName}
                onChange={(e) => setNewComment({ ...newComment, userName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                placeholder="Escribe tu nombre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación
              </label>
              <StarRating 
                rating={newComment.rating} 
                interactive={true}
                onRatingChange={(rating) => setNewComment({ ...newComment, rating })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu opinión
            </label>
            <textarea
              value={newComment.comment}
              onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
              placeholder="Comparte tu experiencia con este producto..."
              required
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="bg-gold hover:bg-yellow-500 text-navy font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Publicar opinión
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductComments;