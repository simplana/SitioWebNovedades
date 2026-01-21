import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductComment {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  helpful_count: number;
  created_at: string;
  user_name?: string;
  user_has_voted?: boolean;
}

export function useProductComments(productId: string) {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    getCurrentUser();
  }, [productId]);

  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: commentsData, error: commentsError } = await supabase
        .from('product_comments')
        .select(`
          *,
          user_profiles!inner(nombre, apellido)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      let votesData: any[] = [];
      if (userId) {
        const { data, error: votesError } = await supabase
          .from('comment_helpful_votes')
          .select('comment_id')
          .eq('user_id', userId);

        if (votesError) throw votesError;
        votesData = data || [];
      }

      const votedCommentIds = new Set(votesData.map(v => v.comment_id));

      const formattedComments: ProductComment[] = (commentsData || []).map(comment => ({
        id: comment.id,
        product_id: comment.product_id,
        user_id: comment.user_id,
        rating: comment.rating,
        comment: comment.comment,
        helpful_count: comment.helpful_count || 0,
        created_at: comment.created_at,
        user_name: comment.user_profiles ? `${comment.user_profiles.nombre} ${comment.user_profiles.apellido}` : 'Usuario',
        user_has_voted: votedCommentIds.has(comment.id)
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error al cargar los comentarios');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (rating: number, commentText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para comentar');

      const { error: insertError } = await supabase
        .from('product_comments')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment: commentText
        });

      if (insertError) throw insertError;

      await loadComments();
      return { success: true };
    } catch (err: any) {
      console.error('Error adding comment:', err);
      return { success: false, error: err.message || 'Error al agregar comentario' };
    }
  };

  const toggleHelpful = async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para votar');

      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      if (comment.user_has_voted) {
        const { error: deleteError } = await supabase
          .from('comment_helpful_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('comment_helpful_votes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (insertError) throw insertError;
      }

      await loadComments();
    } catch (err) {
      console.error('Error toggling helpful vote:', err);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión');

      const { error } = await supabase
        .from('product_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadComments();
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      return { success: false, error: err.message || 'Error al eliminar comentario' };
    }
  };

  const getAverageRating = () => {
    if (comments.length === 0) return 0;
    const sum = comments.reduce((acc, comment) => acc + comment.rating, 0);
    return sum / comments.length;
  };

  const getRatingDistribution = () => {
    return [5, 4, 3, 2, 1].map(rating => {
      const count = comments.filter(c => c.rating === rating).length;
      const percentage = comments.length > 0 ? (count / comments.length) * 100 : 0;
      return { rating, count, percentage };
    });
  };

  return {
    comments,
    loading,
    error,
    currentUserId,
    addComment,
    toggleHelpful,
    deleteComment,
    getAverageRating,
    getRatingDistribution,
    refreshComments: loadComments
  };
}
