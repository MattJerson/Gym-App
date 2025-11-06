import { supabase } from './supabase';

/**
 * ExerciseDataService
 * Handles all exercise-related data operations for the new 1500+ exercise system
 * Uses the exercises table populated from exercises.json
 */
export const ExerciseDataService = {
  /**
   * Search exercises with filters
   * @param {Object} options - Search options
   * @param {string} options.searchQuery - Text search for exercise name
   * @param {string} options.bodyPart - Filter by body part (e.g., 'chest', 'back')
   * @param {string} options.equipment - Filter by equipment (e.g., 'barbell', 'dumbbell')
   * @param {string} options.targetMuscle - Filter by target muscle
   * @param {number} options.limit - Max results to return (default: 50)
   * @param {number} options.offset - Pagination offset (default: 0)
   */
  async searchExercises({
    searchQuery = '',
    bodyPart = null,
    equipment = null,
    targetMuscle = null,
    limit = 50,
    offset = 0
  } = {}) {
    try {
      // For now, simplified search by name only
      // TODO: Add filters via joins later
      let query = supabase
        .from('exercises')
        .select('*', { count: 'exact' });

      // Text search on exercise name
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Pagination and ordering
      query = query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        exercises: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error searching exercises:', error);
      return {
        exercises: [],
        total: 0,
        hasMore: false
      };
    }
  },

  /**
   * Get unique body parts for filtering
   */
  async getBodyParts() {
    try {
      const { data, error } = await supabase
        .from('exercise_body_parts')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;

      return data?.map(bp => bp.name) || [];
    } catch (error) {
      console.error('Error fetching body parts:', error);
      return [];
    }
  },

  /**
   * Get unique equipment types for filtering
   */
  async getEquipmentTypes() {
    try {
      const { data, error } = await supabase
        .from('exercise_equipment')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;

      return data?.map(eq => eq.name) || [];
    } catch (error) {
      console.error('Error fetching equipment types:', error);
      return [];
    }
  },

  /**
   * Get unique muscle groups for filtering
   */
  async getMuscleGroups() {
    try {
      const { data, error } = await supabase
        .from('exercise_muscles')
        .select('name')
        .order('name', { ascending: true });

      if (error) throw error;

      return data?.map(m => m.name) || [];
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      return [];
    }
  },

  /**
   * Get exercise by ID
   */
  async getExerciseById(exerciseId) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching exercise:', error);
      return null;
    }
  },

  /**
   * Get featured/popular exercises
   * Returns a diverse set of exercises across different body parts
   */
  async getFeaturedExercises(limit = 20) {
    try {
      // Get a mix of exercises from different body parts
      const bodyParts = ['chest', 'back', 'upper legs', 'shoulders', 'upper arms', 'lower arms', 'cardio'];
      const exercisesPerBodyPart = Math.ceil(limit / bodyParts.length);
      const exercisePromises = bodyParts.map(async bodyPart => {
        // Query exercises via junction table
        const { data, error } = await supabase
          .from('exercises')
          .select(`
            *,
            exercise_body_part_junction!inner (
              exercise_body_parts!inner (
                name
              )
            )
          `)
          .eq('exercise_body_part_junction.exercise_body_parts.name', bodyPart)
          .limit(exercisesPerBodyPart);
        
        return { data, error };
      });

      const results = await Promise.all(exercisePromises);
      results.forEach((result, index) => {
      });
      
      const allExercises = results
        .filter(result => !result.error)
        .flatMap(result => result.data || []);
      // Shuffle and limit
      const shuffled = allExercises.sort(() => 0.5 - Math.random());
      const limited = shuffled.slice(0, limit);
      return limited;
    } catch (error) {
      console.error('❌ Error fetching featured exercises:', error);
      return [];
    }
  },

  /**
   * Get exercises for a specific body part
   */
  async getExercisesByBodyPart(bodyPart, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_body_part_junction!inner (
            exercise_body_parts!inner (
              name
            )
          )
        `)
        .eq('exercise_body_part_junction.exercise_body_parts.name', bodyPart)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching exercises by body part:', error);
      return [];
    }
  },

  /**
   * Get exercises by equipment
   */
  async getExercisesByEquipment(equipment, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_equipment_junction!inner (
            exercise_equipments!inner (
              name
            )
          )
        `)
        .eq('exercise_equipment_junction.exercise_equipments.name', equipment)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching exercises by equipment:', error);
      return [];
    }
  },

  /**
   * Get total exercise count
   */
  async getTotalExerciseCount() {
    try {
      const { count, error } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error fetching exercise count:', error);
      return 0;
    }
  },

  /**
   * Get exercise statistics (counts by category)
   */
  async getExerciseStatistics() {
    try {
      const [
        bodyParts,
        equipment,
        muscles,
        totalCount
      ] = await Promise.all([
        this.getBodyParts(),
        this.getEquipmentTypes(),
        this.getMuscleGroups(),
        this.getTotalExerciseCount()
      ]);

      return {
        totalExercises: totalCount,
        bodyPartsCount: bodyParts.length,
        equipmentCount: equipment.length,
        muscleGroupsCount: muscles.length,
        bodyParts,
        equipment,
        muscles
      };
    } catch (error) {
      console.error('Error fetching exercise statistics:', error);
      return {
        totalExercises: 0,
        bodyPartsCount: 0,
        equipmentCount: 0,
        muscleGroupsCount: 0,
        bodyParts: [],
        equipment: [],
        muscles: []
      };
    }
  }
};
