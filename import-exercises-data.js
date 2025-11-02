/**
 * Import exercises data from JSON files to Supabase
 * 
 * This script:
 * 1. Reads exercises.json, bodyparts.json, equipments.json, muscles.json
 * 2. Imports lookup data (body parts, equipment, muscles)
 * 3. Imports exercises with all relationships
 * 4. Assigns appropriate MET values based on exercise type
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment or hardcode for testing
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// MET value assignments based on exercise characteristics
const MET_VALUES = {
  // Cardio exercises (high intensity)
  cardio_high: 12.0,
  cardio_moderate: 8.0,
  cardio_low: 5.0,
  
  // Strength training
  weightlifting_intense: 6.0,
  weightlifting_moderate: 3.5,
  bodyweight_intense: 8.0,
  bodyweight_moderate: 4.0,
  
  // Default
  default: 4.5
};

function assignMETValue(exercise) {
  const name = exercise.name.toLowerCase();
  const equipment = exercise.equipments[0]?.toLowerCase() || '';
  const bodyPart = exercise.bodyParts[0]?.toLowerCase() || '';
  
  // Cardio exercises
  if (bodyPart === 'cardio' || 
      name.includes('run') || 
      name.includes('jump') || 
      name.includes('sprint') ||
      name.includes('burpee')) {
    return MET_VALUES.cardio_high;
  }
  
  // High intensity bodyweight
  if (equipment === 'body weight' && 
      (name.includes('plyo') || 
       name.includes('explosive') || 
       name.includes('jump'))) {
    return MET_VALUES.bodyweight_intense;
  }
  
  // Heavy weights
  if ((equipment.includes('barbell') || equipment.includes('dumbbell')) &&
      (name.includes('squat') || 
       name.includes('deadlift') || 
       name.includes('press'))) {
    return MET_VALUES.weightlifting_intense;
  }
  
  // Moderate strength training
  if (equipment !== 'body weight' && equipment !== '') {
    return MET_VALUES.weightlifting_moderate;
  }
  
  // Moderate bodyweight
  if (equipment === 'body weight') {
    return MET_VALUES.bodyweight_moderate;
  }
  
  return MET_VALUES.default;
}

async function importData() {
  console.log('🚀 Starting exercises data import...\n');
  
  try {
    // Step 1: Read JSON files
    console.log('📖 Reading JSON files...');
    const dataPath = path.join(__dirname, 'workouts', 'src', 'data');
    
    const [exercises, bodyParts, equipments, muscles] = await Promise.all([
      fs.readFile(path.join(dataPath, 'exercises.json'), 'utf-8').then(JSON.parse),
      fs.readFile(path.join(dataPath, 'bodyparts.json'), 'utf-8').then(JSON.parse),
      fs.readFile(path.join(dataPath, 'equipments.json'), 'utf-8').then(JSON.parse),
      fs.readFile(path.join(dataPath, 'muscles.json'), 'utf-8').then(JSON.parse)
    ]);
    
    console.log(`✅ Loaded ${exercises.length} exercises`);
    console.log(`✅ Loaded ${bodyParts.length} body parts`);
    console.log(`✅ Loaded ${equipments.length} equipment types`);
    console.log(`✅ Loaded ${muscles.length} muscle groups\n`);
    
    // Step 2: Import body parts
    console.log('📥 Importing body parts...');
    const bodyPartMap = new Map();
    for (const bp of bodyParts) {
      const { data, error } = await supabase
        .from('exercise_body_parts')
        .upsert({ name: bp.name }, { onConflict: 'name' })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error importing body part ${bp.name}:`, error);
      } else {
        bodyPartMap.set(bp.name, data.id);
      }
    }
    console.log(`✅ Imported ${bodyPartMap.size} body parts\n`);
    
    // Step 3: Import equipment
    console.log('📥 Importing equipment...');
    const equipmentMap = new Map();
    for (const eq of equipments) {
      const { data, error } = await supabase
        .from('exercise_equipments')
        .upsert({ name: eq.name }, { onConflict: 'name' })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error importing equipment ${eq.name}:`, error);
      } else {
        equipmentMap.set(eq.name, data.id);
      }
    }
    console.log(`✅ Imported ${equipmentMap.size} equipment types\n`);
    
    // Step 4: Import muscles
    console.log('📥 Importing muscles...');
    const muscleMap = new Map();
    for (const muscle of muscles) {
      const { data, error } = await supabase
        .from('exercise_target_muscles')
        .upsert({ name: muscle.name }, { onConflict: 'name' })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error importing muscle ${muscle.name}:`, error);
      } else {
        muscleMap.set(muscle.name, data.id);
      }
    }
    console.log(`✅ Imported ${muscleMap.size} muscle groups\n`);
    
    // Step 5: Import exercises with relationships
    console.log('📥 Importing exercises...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      if (i % 100 === 0) {
        console.log(`Progress: ${i}/${exercises.length} exercises...`);
      }
      
      try {
        // Calculate MET value
        const metValue = assignMETValue(exercise);
        
        // Insert exercise
        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercises')
          .upsert({
            exercise_id: exercise.exerciseId,
            name: exercise.name,
            gif_url: exercise.gifUrl,
            instructions: exercise.instructions,
            met_value: metValue
          }, { onConflict: 'exercise_id' })
          .select()
          .single();
        
        if (exerciseError) {
          throw exerciseError;
        }
        
        // Insert target muscles (primary)
        for (const muscle of exercise.targetMuscles) {
          const muscleId = muscleMap.get(muscle);
          if (muscleId) {
            await supabase
              .from('exercise_target_muscle_junction')
              .upsert({
                exercise_id: exerciseData.id,
                muscle_id: muscleId,
                is_primary: true
              }, { onConflict: 'exercise_id,muscle_id' });
          }
        }
        
        // Insert secondary muscles
        if (exercise.secondaryMuscles) {
          for (const muscle of exercise.secondaryMuscles) {
            const muscleId = muscleMap.get(muscle);
            if (muscleId) {
              await supabase
                .from('exercise_target_muscle_junction')
                .upsert({
                  exercise_id: exerciseData.id,
                  muscle_id: muscleId,
                  is_primary: false
                }, { onConflict: 'exercise_id,muscle_id' });
            }
          }
        }
        
        // Insert body parts
        for (const bodyPart of exercise.bodyParts) {
          const bodyPartId = bodyPartMap.get(bodyPart);
          if (bodyPartId) {
            await supabase
              .from('exercise_body_part_junction')
              .upsert({
                exercise_id: exerciseData.id,
                body_part_id: bodyPartId
              }, { onConflict: 'exercise_id,body_part_id' });
          }
        }
        
        // Insert equipment
        for (const equipment of exercise.equipments) {
          const equipmentId = equipmentMap.get(equipment);
          if (equipmentId) {
            await supabase
              .from('exercise_equipment_junction')
              .upsert({
                exercise_id: exerciseData.id,
                equipment_id: equipmentId
              }, { onConflict: 'exercise_id,equipment_id' });
          }
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error importing exercise ${exercise.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Successfully imported ${successCount} exercises`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} exercises failed to import`);
    }
    
    // Step 6: Verify import
    console.log('\n📊 Verifying import...');
    const { count: exerciseCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
    
    const { count: bodyPartCount } = await supabase
      .from('exercise_body_parts')
      .select('*', { count: 'exact', head: true });
    
    const { count: equipmentCount } = await supabase
      .from('exercise_equipments')
      .select('*', { count: 'exact', head: true });
    
    const { count: muscleCount } = await supabase
      .from('exercise_target_muscles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 Final counts:`);
    console.log(`   Exercises: ${exerciseCount}`);
    console.log(`   Body Parts: ${bodyPartCount}`);
    console.log(`   Equipment: ${equipmentCount}`);
    console.log(`   Muscles: ${muscleCount}`);
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import
importData();
