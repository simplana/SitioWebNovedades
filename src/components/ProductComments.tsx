import React, { useState } from 'react';
import { User, ThumbsUp, Star, Loader, Trash2 } from 'lucide-react';
import StarRating from './StarRating';
import { useProductComments } from '../hooks/useProductComments';
import { useAuth } from '../hooks/useAuth';

interface ProductCommentsProps {
  productId: string;
  productName: string;
}

const ProductComments: React.FC<ProductCommentsProps> = ({ productId, productName }) => {
  const { user } = useAuth();
  const {
    comments,
    loading,
    error,
    currentUserId,
    addComment,
    toggleHelpful,
    deleteComment,
    getAverageRating,
    getRatingDistribution
  } = useProductComments(productId);

  const [newComment, setNewComment] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setSubmitError('Debes iniciar sesión para dejar un comentario');
      return;
    }

    if (!newComment.comment.trim()) {
      setSubmitError('El comentario no puede estar vacío');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const result = await addComment(newComment.rating, newComment.comment);

    if (result.success) {
      setNewComment({ rating: 5, comment: '' });
    } else {
      setSubmitError(result.error || 'Error al agregar comentario');
    }

    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      await deleteComment(commentId);
    }
  };

  const averageRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 text-gold animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="font-playfair text-2xl font-bold text-navy mb-6">
        Opiniones de clientes
      </h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {comments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b">
            <div className="text-center">
              <div className="text-4xl font-bold text-gold mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="lg" />
              <p className="text-gray-600 mt-2">
                Basado en {comments.length} {comments.length === 1 ? 'opinión' : 'opiniones'}
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

          <div className="space-y-6 mb-8">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-6 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-gold p-2 rounded-full">
                    <User className="h-5 w-5 text-navy" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-navy">{comment.user_name || 'Usuario'}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        {currentUserId === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar comentario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <StarRating rating={comment.rating} size="sm" />
                    <p className="text-gray-700 mt-3 leading-relaxed">
                      {comment.comment}
                    </p>
                    <button
                      onClick={() => toggleHelpful(comment.id)}
                      disabled={!user}
                      className={`mt-3 flex items-center space-x-2 text-sm transition-colors duration-200 ${
                        comment.user_has_voted
                          ? 'text-gold'
                          : 'text-gray-500 hover:text-gold'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>Útil ({comment.helpful_count})</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 border-b mb-8">
          <p className="text-gray-500 mb-2">Aún no hay opiniones para este producto</p>
          <p className="text-sm text-gray-400">Sé el primero en compartir tu experiencia</p>
        </div>
      )}

      <div className="border-t pt-8">
        <h4 className="font-playfair text-xl font-semibold text-navy mb-4">
          Comparte tu opinión
        </h4>

        {!user ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            Debes iniciar sesión para dejar un comentario
          </div>
        ) : (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            {submitError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}

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
                disabled={submitting}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gold hover:bg-yellow-500 text-navy font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {submitting && <Loader className="h-4 w-4 animate-spin" />}
              <span>{submitting ? 'Publicando...' : 'Publicar opinión'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductComments;