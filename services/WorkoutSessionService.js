import AsyncStorage from '@react-native-async-storage/async-storage';

// Workout Session Service - Handles workout tracking and progress
export const WorkoutSessionService = {
  
  // Get workout details by ID
  async getWorkoutById(workoutId) {
    console.log('Loading workout with ID:', workoutId); // Debug log
    
    // Mock data - replace with actual API call
    const workouts = {
      'workout_124': {
        id: 'workout_124',
        name: 'Pull Day - Back & Biceps',
        description: 'Complete back and biceps workout focusing on pulling movements',
        estimatedDuration: 45,
        difficulty: 'Intermediate',
        exercises: [
          {
            id: 'pull-ups',
            name: 'Pull-ups',
            sets: 4,
            reps: '8-12',
            restTime: '90s',
            targetMuscles: ['Lats', 'Rhomboids', 'Biceps'],
            instructions: [
              'Hang from a pull-up bar with palms facing away',
              'Pull your body up until your chin is above the bar',
              'Lower yourself back down with control',
              'Repeat for the specified number of reps'
            ],
            tips: [
              'Keep your core engaged throughout the movement',
              'Focus on pulling with your back muscles, not just arms',
              'If you can\'t do bodyweight, use an assisted pull-up machine'
            ],
            difficulty: 'Advanced',
            equipment: 'Pull-up Bar',
            videoUrl: null
          },
          {
            id: 'bent-over-rows',
            name: 'Bent-over Barbell Rows',
            sets: 4,
            reps: '8-10',
            restTime: '2m',
            targetMuscles: ['Lats', 'Rhomboids', 'Middle Traps'],
            instructions: [
              'Stand with feet hip-width apart, holding a barbell',
              'Hinge at the hips and lean forward about 45 degrees',
              'Pull the barbell to your lower chest/upper abdomen',
              'Lower with control and repeat'
            ],
            tips: [
              'Keep your back straight and core engaged',
              'Squeeze your shoulder blades together at the top',
              'Don\'t use momentum - control the weight'
            ],
            difficulty: 'Intermediate',
            equipment: 'Barbell',
            videoUrl: null
          },
          {
            id: 'lat-pulldowns',
            name: 'Lat Pulldowns',
            sets: 3,
            reps: '10-12',
            restTime: '90s',
            targetMuscles: ['Lats', 'Rhomboids', 'Rear Delts'],
            instructions: [
              'Sit at the lat pulldown machine with knees secured',
              'Grip the bar slightly wider than shoulder-width',
              'Pull the bar down to your upper chest',
              'Slowly return to starting position'
            ],
            tips: [
              'Lean back slightly for better lat engagement',
              'Focus on pulling with your lats, not your arms',
              'Don\'t pull the bar behind your neck'
            ],
            difficulty: 'Beginner',
            equipment: 'Cable Machine',
            videoUrl: null
          },
          {
            id: 'bicep-curls',
            name: 'Dumbbell Bicep Curls',
            sets: 3,
            reps: '10-12',
            restTime: '60s',
            targetMuscles: ['Biceps'],
            instructions: [
              'Stand with dumbbells at your sides, palms facing forward',
              'Curl the weights up by flexing your biceps',
              'Squeeze at the top, then lower slowly',
              'Keep your elbows stationary throughout'
            ],
            tips: [
              'Don\'t swing the weights - use controlled movement',
              'Focus on the squeeze at the top of each rep',
              'Keep your wrists straight and strong'
            ],
            difficulty: 'Beginner',
            equipment: 'Dumbbells',
            videoUrl: null
          },
          {
            id: 'hammer-curls',
            name: 'Hammer Curls',
            sets: 3,
            reps: '10-12',
            restTime: '60s',
            targetMuscles: ['Biceps', 'Brachialis', 'Forearms'],
            instructions: [
              'Hold dumbbells with a neutral grip (palms facing each other)',
              'Curl the weights up while keeping the neutral grip',
              'Squeeze and slowly lower back down',
              'Maintain control throughout the movement'
            ],
            tips: [
              'This variation targets the brachialis muscle',
              'Keep your elbows close to your body',
              'Don\'t let the weights touch at the top'
            ],
            difficulty: 'Beginner',
            equipment: 'Dumbbells',
            videoUrl: null
          },
          {
            id: 'face-pulls',
            name: 'Cable Face Pulls',
            sets: 3,
            reps: '12-15',
            restTime: '45s',
            targetMuscles: ['Rear Delts', 'Rhomboids', 'Middle Traps'],
            instructions: [
              'Set cable machine to eye level with rope attachment',
              'Pull the rope towards your face, separating the ends',
              'Focus on squeezing your shoulder blades together',
              'Slowly return to starting position'
            ],
            tips: [
              'This exercise helps improve posture',
              'Keep your elbows high throughout the movement',
              'Focus on pulling with your rear delts'
            ],
            difficulty: 'Beginner',
            equipment: 'Cable Machine',
            videoUrl: null
          }
        ]
      },
      'w1': {
        id: 'w1',
        name: 'Upper Body Strength',
        description: 'Build upper body strength with compound movements',
        estimatedDuration: 45,
        difficulty: 'Intermediate',
        exercises: [
          {
            id: 'bench-press',
            name: 'Bench Press',
            sets: 4,
            reps: '8-10',
            restTime: '2-3m',
            targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
            instructions: [
              'Lie on bench with feet flat on floor',
              'Grip barbell slightly wider than shoulder-width',
              'Lower bar to chest with control',
              'Press up explosively to starting position'
            ],
            tips: [
              'Keep your core tight throughout the movement',
              'Don\'t bounce the bar off your chest',
              'Use a spotter for heavy weights'
            ],
            difficulty: 'Intermediate',
            equipment: 'Barbell',
            videoUrl: null
          },
          {
            id: 'overhead-press',
            name: 'Overhead Press',
            sets: 4,
            reps: '8-10',
            restTime: '2-3m',
            targetMuscles: ['Shoulders', 'Triceps', 'Core'],
            instructions: [
              'Stand with feet shoulder-width apart',
              'Hold barbell at shoulder height',
              'Press overhead until arms are fully extended',
              'Lower with control to starting position'
            ],
            tips: [
              'Keep your core engaged for stability',
              'Don\'t arch your back excessively',
              'Press in a straight line above your head'
            ],
            difficulty: 'Intermediate',
            equipment: 'Barbell',
            videoUrl: null
          },
          {
            id: 'incline-dumbbell-press',
            name: 'Incline Dumbbell Press',
            sets: 3,
            reps: '10-12',
            restTime: '90s',
            targetMuscles: ['Upper Chest', 'Shoulders', 'Triceps'],
            instructions: [
              'Set bench to 30-45 degree incline',
              'Hold dumbbells at shoulder height',
              'Press up and slightly inward',
              'Lower with control to starting position'
            ],
            tips: [
              'Focus on squeezing your chest at the top',
              'Don\'t let dumbbells drift too far apart',
              'Keep your feet firmly planted'
            ],
            difficulty: 'Beginner',
            equipment: 'Dumbbells',
            videoUrl: null
          },
          {
            id: 'tricep-dips',
            name: 'Tricep Dips',
            sets: 3,
            reps: '10-15',
            restTime: '60s',
            targetMuscles: ['Triceps', 'Chest', 'Shoulders'],
            instructions: [
              'Place hands on parallel bars or bench',
              'Lower body by bending elbows',
              'Descend until slight stretch in chest',
              'Push back up to starting position'
            ],
            tips: [
              'Keep your body upright',
              'Don\'t descend too low to avoid shoulder strain',
              'Use assistance if needed'
            ],
            difficulty: 'Intermediate',
            equipment: 'Parallel Bars',
            videoUrl: null
          },
          {
            id: 'lateral-raises',
            name: 'Lateral Raises',
            sets: 3,
            reps: '12-15',
            restTime: '60s',
            targetMuscles: ['Side Delts'],
            instructions: [
              'Stand with dumbbells at your sides',
              'Raise arms out to sides until parallel to floor',
              'Hold briefly at the top',
              'Lower with control'
            ],
            tips: [
              'Use a slight forward lean',
              'Don\'t swing the weights',
              'Focus on feeling the burn in your delts'
            ],
            difficulty: 'Beginner',
            equipment: 'Dumbbells',
            videoUrl: null
          },
          {
            id: 'close-grip-bench',
            name: 'Close-Grip Bench Press',
            sets: 3,
            reps: '8-12',
            restTime: '90s',
            targetMuscles: ['Triceps', 'Chest'],
            instructions: [
              'Lie on bench with narrow grip on barbell',
              'Keep elbows close to body',
              'Lower bar to chest',
              'Press up focusing on triceps'
            ],
            tips: [
              'Don\'t grip too narrow to avoid wrist strain',
              'Keep elbows tucked in',
              'Focus on tricep contraction'
            ],
            difficulty: 'Intermediate',
            equipment: 'Barbell',
            videoUrl: null
          },
          {
            id: 'cable-crossovers',
            name: 'Cable Crossovers',
            sets: 3,
            reps: '12-15',
            restTime: '60s',
            targetMuscles: ['Chest', 'Front Delts'],
            instructions: [
              'Stand between cable machines',
              'Grab handles with arms extended',
              'Bring handles together in arc motion',
              'Return to starting position with control'
            ],
            tips: [
              'Keep a slight bend in your elbows',
              'Focus on squeezing chest muscles',
              'Control the weight on the way back'
            ],
            difficulty: 'Beginner',
            equipment: 'Cable Machine',
            videoUrl: null
          },
          {
            id: 'face-pulls-upper',
            name: 'Face Pulls',
            sets: 3,
            reps: '15-20',
            restTime: '45s',
            targetMuscles: ['Rear Delts', 'Rhomboids'],
            instructions: [
              'Set cable to eye level with rope',
              'Pull rope towards face',
              'Separate hands at face level',
              'Return with control'
            ],
            tips: [
              'Keep elbows high',
              'Focus on rear delt squeeze',
              'Great for posture improvement'
            ],
            difficulty: 'Beginner',
            equipment: 'Cable Machine',
            videoUrl: null
          }
        ]
      },
      'w2': {
        id: 'w2',
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for maximum calorie burn',
        estimatedDuration: 30,
        difficulty: 'Advanced',
        exercises: [
          {
            id: 'burpees',
            name: 'Burpees',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Full Body'],
            instructions: [
              'Start in standing position',
              'Drop to squat, place hands on floor',
              'Jump feet back to plank position',
              'Do a push-up, jump feet to squat, jump up'
            ],
            tips: [
              'Maintain steady rhythm',
              'Keep core engaged throughout',
              'Modify by stepping instead of jumping'
            ],
            difficulty: 'Advanced',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'mountain-climbers',
            name: 'Mountain Climbers',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Core', 'Shoulders', 'Legs'],
            instructions: [
              'Start in plank position',
              'Alternate bringing knees to chest',
              'Keep hips level and core tight',
              'Maintain quick pace'
            ],
            tips: [
              'Don\'t let hips pike up',
              'Keep shoulders over wrists',
              'Breathe steadily'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'jump-squats',
            name: 'Jump Squats',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Quads', 'Glutes', 'Calves'],
            instructions: [
              'Stand with feet shoulder-width apart',
              'Lower into squat position',
              'Explode up into a jump',
              'Land softly and repeat immediately'
            ],
            tips: [
              'Land with soft knees',
              'Keep chest up throughout',
              'Use arms for momentum'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'high-knees',
            name: 'High Knees',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Legs', 'Core'],
            instructions: [
              'Stand with feet hip-width apart',
              'Run in place lifting knees high',
              'Bring knees up to waist level',
              'Pump arms naturally'
            ],
            tips: [
              'Stay on balls of feet',
              'Keep core engaged',
              'Maintain quick cadence'
            ],
            difficulty: 'Beginner',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'plank-jacks',
            name: 'Plank Jacks',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Core', 'Shoulders'],
            instructions: [
              'Start in plank position',
              'Jump feet apart and together',
              'Keep core tight and hips level',
              'Maintain plank throughout'
            ],
            tips: [
              'Don\'t let hips sag or pike',
              'Keep shoulders stable',
              'Start slow and build speed'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'jumping-lunges',
            name: 'Jumping Lunges',
            sets: 4,
            reps: '45s work / 15s rest',
            restTime: '60s',
            targetMuscles: ['Quads', 'Glutes', 'Calves'],
            instructions: [
              'Start in lunge position',
              'Jump up and switch leg positions',
              'Land in opposite lunge',
              'Continue alternating explosively'
            ],
            tips: [
              'Land with control',
              'Keep chest up and core tight',
              'Use arms for balance'
            ],
            difficulty: 'Advanced',
            equipment: 'Bodyweight',
            videoUrl: null
          }
        ]
      },
      'w3': {
        id: 'w3',
        name: 'Lower Body Power',
        description: 'Build explosive power and strength in your legs and glutes',
        estimatedDuration: 50,
        difficulty: 'Intermediate',
        exercises: [
          {
            id: 'barbell-squats',
            name: 'Barbell Squats',
            sets: 4,
            reps: '6-8',
            restTime: '90s',
            targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
            instructions: [
              'Position barbell on upper traps',
              'Stand with feet shoulder-width apart',
              'Lower by pushing hips back and knees out',
              'Drive through heels to return to start'
            ],
            tips: [
              'Keep chest up and core tight',
              'Don\'t let knees cave inward',
              'Go as low as mobility allows'
            ],
            difficulty: 'Intermediate',
            equipment: 'Barbell, Squat Rack',
            videoUrl: null
          },
          {
            id: 'deadlifts',
            name: 'Deadlifts',
            sets: 4,
            reps: '5-6',
            restTime: '2-3min',
            targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
            instructions: [
              'Stand with feet hip-width apart',
              'Grip bar with hands outside legs',
              'Keep back straight, drive through heels',
              'Stand up by extending hips and knees'
            ],
            tips: [
              'Keep bar close to body',
              'Engage lats to protect back',
              'Don\'t round your back'
            ],
            difficulty: 'Advanced',
            equipment: 'Barbell, Plates',
            videoUrl: null
          },
          {
            id: 'bulgarian-split-squats',
            name: 'Bulgarian Split Squats',
            sets: 3,
            reps: '10-12 each leg',
            restTime: '60s',
            targetMuscles: ['Quads', 'Glutes'],
            instructions: [
              'Place rear foot on bench behind you',
              'Lower into lunge position',
              'Drive through front heel to return',
              'Complete all reps before switching legs'
            ],
            tips: [
              'Keep most weight on front leg',
              'Don\'t let front knee cave inward',
              'Control the descent'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bench, Dumbbells (optional)',
            videoUrl: null
          },
          {
            id: 'hip-thrusts',
            name: 'Hip Thrusts',
            sets: 3,
            reps: '12-15',
            restTime: '60s',
            targetMuscles: ['Glutes', 'Hamstrings'],
            instructions: [
              'Sit with upper back against bench',
              'Place barbell over hips',
              'Drive through heels to lift hips up',
              'Squeeze glutes at the top'
            ],
            tips: [
              'Keep chin tucked',
              'Drive through heels, not toes',
              'Pause briefly at the top'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bench, Barbell',
            videoUrl: null
          },
          {
            id: 'walking-lunges',
            name: 'Walking Lunges',
            sets: 3,
            reps: '12-16 steps',
            restTime: '60s',
            targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
            instructions: [
              'Step forward into lunge position',
              'Lower until both knees at 90 degrees',
              'Push off back foot to step forward',
              'Continue alternating legs'
            ],
            tips: [
              'Keep torso upright',
              'Don\'t let front knee go past toes',
              'Take large steps'
            ],
            difficulty: 'Beginner',
            equipment: 'Dumbbells (optional)',
            videoUrl: null
          },
          {
            id: 'calf-raises',
            name: 'Calf Raises',
            sets: 4,
            reps: '15-20',
            restTime: '45s',
            targetMuscles: ['Calves'],
            instructions: [
              'Stand on balls of feet on platform',
              'Let heels drop below platform level',
              'Rise up onto toes as high as possible',
              'Lower slowly with control'
            ],
            tips: [
              'Get full range of motion',
              'Pause briefly at the top',
              'Control the negative'
            ],
            difficulty: 'Beginner',
            equipment: 'Platform, Weight (optional)',
            videoUrl: null
          }
        ]
      },
      'w4': {
        id: 'w4',
        name: 'Yoga Flow',
        description: 'Gentle flow for flexibility, balance, and mindfulness',
        estimatedDuration: 40,
        difficulty: 'Beginner',
        exercises: [
          {
            id: 'sun-salutation-a',
            name: 'Sun Salutation A',
            sets: 3,
            reps: '1 flow',
            restTime: '30s',
            targetMuscles: ['Full Body'],
            instructions: [
              'Start in mountain pose',
              'Reach arms up, fold forward',
              'Step back to plank, lower to chaturanga',
              'Upward dog, downward dog, step forward, rise up'
            ],
            tips: [
              'Focus on breath coordination',
              'Move slowly and mindfully',
              'Modify as needed for your level'
            ],
            difficulty: 'Beginner',
            equipment: 'Yoga Mat',
            videoUrl: null
          },
          {
            id: 'warrior-sequence',
            name: 'Warrior Sequence',
            sets: 2,
            reps: '5 breaths each side',
            restTime: '30s',
            targetMuscles: ['Legs', 'Core', 'Arms'],
            instructions: [
              'Warrior I: High lunge with arms up',
              'Warrior II: Open hips, arms parallel',
              'Warrior III: Balance on one leg, arms forward',
              'Repeat on other side'
            ],
            tips: [
              'Keep front knee over ankle',
              'Engage core for balance',
              'Breathe deeply throughout'
            ],
            difficulty: 'Intermediate',
            equipment: 'Yoga Mat',
            videoUrl: null
          },
          {
            id: 'triangle-pose',
            name: 'Triangle Pose',
            sets: 2,
            reps: '5 breaths each side',
            restTime: '20s',
            targetMuscles: ['Hamstrings', 'Core', 'Side Body'],
            instructions: [
              'Wide-legged forward fold',
              'Turn right foot out 90 degrees',
              'Reach right hand toward floor',
              'Extend left arm toward ceiling'
            ],
            tips: [
              'Keep both legs straight',
              'Don\'t collapse over front leg',
              'Use block under hand if needed'
            ],
            difficulty: 'Beginner',
            equipment: 'Yoga Mat, Block (optional)',
            videoUrl: null
          },
          {
            id: 'tree-pose',
            name: 'Tree Pose',
            sets: 2,
            reps: '30s each side',
            restTime: '15s',
            targetMuscles: ['Legs', 'Core'],
            instructions: [
              'Stand on left leg',
              'Place right foot on inner left thigh',
              'Hands at heart center or overhead',
              'Focus on a point for balance'
            ],
            tips: [
              'Avoid placing foot on side of knee',
              'Press foot into leg, leg into foot',
              'Use wall for support if needed'
            ],
            difficulty: 'Beginner',
            equipment: 'Yoga Mat',
            videoUrl: null
          },
          {
            id: 'seated-spinal-twist',
            name: 'Seated Spinal Twist',
            sets: 2,
            reps: '5 breaths each side',
            restTime: '20s',
            targetMuscles: ['Spine', 'Core'],
            instructions: [
              'Sit with legs extended',
              'Bend right knee, place foot outside left thigh',
              'Twist to right, left elbow against right knee',
              'Repeat on other side'
            ],
            tips: [
              'Sit tall through the spine',
              'Initiate twist from core',
              'Don\'t force the twist'
            ],
            difficulty: 'Beginner',
            equipment: 'Yoga Mat',
            videoUrl: null
          },
          {
            id: 'childs-pose',
            name: 'Child\'s Pose',
            sets: 1,
            reps: '1-2 minutes',
            restTime: '0s',
            targetMuscles: ['Back', 'Hips'],
            instructions: [
              'Kneel on mat with big toes touching',
              'Sit back on heels',
              'Fold forward, arms extended or by sides',
              'Rest forehead on mat'
            ],
            tips: [
              'Widen knees for more space',
              'Use bolster under torso if needed',
              'Focus on deep breathing'
            ],
            difficulty: 'Beginner',
            equipment: 'Yoga Mat',
            videoUrl: null
          }
        ]
      },
      'w5': {
        id: 'w5',
        name: 'Core Crusher',
        description: 'Intense core workout to build strength and stability',
        estimatedDuration: 25,
        difficulty: 'Intermediate',
        exercises: [
          {
            id: 'plank-hold',
            name: 'Plank Hold',
            sets: 3,
            reps: '45-60s',
            restTime: '60s',
            targetMuscles: ['Core', 'Shoulders'],
            instructions: [
              'Start in push-up position',
              'Keep body in straight line',
              'Engage core and glutes',
              'Hold position for time'
            ],
            tips: [
              'Don\'t let hips sag or pike',
              'Breathe normally',
              'Keep shoulders over wrists'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'russian-twists',
            name: 'Russian Twists',
            sets: 3,
            reps: '20-24',
            restTime: '45s',
            targetMuscles: ['Obliques', 'Core'],
            instructions: [
              'Sit with knees bent, lean back slightly',
              'Lift feet off ground',
              'Rotate torso side to side',
              'Touch hands to ground each side'
            ],
            tips: [
              'Keep chest up and core tight',
              'Control the movement',
              'Add weight for more challenge'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight, Weight (optional)',
            videoUrl: null
          },
          {
            id: 'bicycle-crunches',
            name: 'Bicycle Crunches',
            sets: 3,
            reps: '20-24',
            restTime: '45s',
            targetMuscles: ['Core', 'Obliques'],
            instructions: [
              'Lie on back, hands behind head',
              'Bring opposite elbow to knee',
              'Alternate sides in cycling motion',
              'Keep other leg extended'
            ],
            tips: [
              'Don\'t pull on neck',
              'Focus on bringing elbow to knee',
              'Keep movements controlled'
            ],
            difficulty: 'Beginner',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'dead-bug',
            name: 'Dead Bug',
            sets: 3,
            reps: '10-12 each side',
            restTime: '45s',
            targetMuscles: ['Core', 'Hip Flexors'],
            instructions: [
              'Lie on back, arms up, knees bent 90°',
              'Lower opposite arm and leg slowly',
              'Return to start position',
              'Alternate sides'
            ],
            tips: [
              'Keep lower back pressed to floor',
              'Move slowly and controlled',
              'Don\'t let back arch'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'mountain-climber-twists',
            name: 'Mountain Climber Twists',
            sets: 3,
            reps: '20-24',
            restTime: '45s',
            targetMuscles: ['Core', 'Obliques', 'Shoulders'],
            instructions: [
              'Start in plank position',
              'Bring knee to opposite elbow',
              'Return to plank, repeat other side',
              'Maintain plank throughout'
            ],
            tips: [
              'Keep hips level',
              'Don\'t rush the movement',
              'Engage core throughout'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'hollow-body-hold',
            name: 'Hollow Body Hold',
            sets: 3,
            reps: '30-45s',
            restTime: '60s',
            targetMuscles: ['Core'],
            instructions: [
              'Lie on back, press lower back down',
              'Lift shoulders and legs off ground',
              'Hold position, creating banana shape',
              'Keep arms extended overhead'
            ],
            tips: [
              'Keep lower back on ground',
              'If too hard, bend knees',
              'Breathe normally'
            ],
            difficulty: 'Advanced',
            equipment: 'Bodyweight',
            videoUrl: null
          }
        ]
      },
      'w6': {
        id: 'w6',
        name: 'Functional Movement',
        description: 'Real-world movement patterns for everyday strength',
        estimatedDuration: 35,
        difficulty: 'Intermediate',
        exercises: [
          {
            id: 'squat-to-press',
            name: 'Squat to Press',
            sets: 3,
            reps: '12-15',
            restTime: '60s',
            targetMuscles: ['Full Body'],
            instructions: [
              'Hold dumbbells at shoulder height',
              'Squat down keeping chest up',
              'Drive up and press weights overhead',
              'Lower weights back to shoulders'
            ],
            tips: [
              'Keep core engaged throughout',
              'Don\'t let knees cave inward',
              'Press straight up, not forward'
            ],
            difficulty: 'Intermediate',
            equipment: 'Dumbbells',
            videoUrl: null
          },
          {
            id: 'reverse-lunge-with-rotation',
            name: 'Reverse Lunge with Rotation',
            sets: 3,
            reps: '10-12 each side',
            restTime: '60s',
            targetMuscles: ['Legs', 'Core', 'Glutes'],
            instructions: [
              'Step back into reverse lunge',
              'Hold medicine ball or weight',
              'Rotate toward front leg',
              'Return to center and step back up'
            ],
            tips: [
              'Keep front knee over ankle',
              'Rotate from core, not arms',
              'Control the movement'
            ],
            difficulty: 'Intermediate',
            equipment: 'Medicine Ball or Dumbbell',
            videoUrl: null
          },
          {
            id: 'farmers-walk',
            name: 'Farmer\'s Walk',
            sets: 3,
            reps: '40-60 steps',
            restTime: '90s',
            targetMuscles: ['Grip', 'Core', 'Traps'],
            instructions: [
              'Hold heavy weights at sides',
              'Stand tall with shoulders back',
              'Walk with normal stride',
              'Maintain good posture throughout'
            ],
            tips: [
              'Don\'t let shoulders round',
              'Keep core tight',
              'Take normal steps'
            ],
            difficulty: 'Beginner',
            equipment: 'Heavy Dumbbells or Kettlebells',
            videoUrl: null
          },
          {
            id: 'bear-crawl',
            name: 'Bear Crawl',
            sets: 3,
            reps: '20-30 steps',
            restTime: '60s',
            targetMuscles: ['Full Body'],
            instructions: [
              'Start on hands and feet',
              'Keep knees slightly off ground',
              'Move opposite hand and foot forward',
              'Keep hips level and core tight'
            ],
            tips: [
              'Don\'t let hips sway',
              'Keep movements controlled',
              'Start slowly'
            ],
            difficulty: 'Intermediate',
            equipment: 'Bodyweight',
            videoUrl: null
          },
          {
            id: 'turkish-get-up',
            name: 'Turkish Get-Up',
            sets: 2,
            reps: '3-5 each side',
            restTime: '90s',
            targetMuscles: ['Full Body'],
            instructions: [
              'Lie on back holding weight up',
              'Follow sequence: roll, sit up, lunge up',
              'Stand up while keeping weight overhead',
              'Reverse the movement to return'
            ],
            tips: [
              'Start with light weight',
              'Focus on control, not speed',
              'Keep eyes on weight throughout'
            ],
            difficulty: 'Advanced',
            equipment: 'Kettlebell or Dumbbell',
            videoUrl: null
          },
          {
            id: 'single-leg-deadlift',
            name: 'Single Leg Deadlift',
            sets: 3,
            reps: '8-10 each leg',
            restTime: '60s',
            targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
            instructions: [
              'Stand on one leg holding weight',
              'Hinge at hip, reach weight toward ground',
              'Keep back straight, lift back leg',
              'Return to standing'
            ],
            tips: [
              'Focus on balance and control',
              'Keep supporting leg slightly bent',
              'Don\'t round your back'
            ],
            difficulty: 'Intermediate',
            equipment: 'Dumbbell or Kettlebell',
            videoUrl: null
          }
        ]
      }
    };
    
    // Add aliases for the same workout
    workouts['pull-day'] = workouts['workout_124'];
    
    const workout = workouts[workoutId];
    // If exact ID not found, try common variations
    if (!workout) {
      const fallbackIds = ['workout_124', 'pull-day', 'pullday'];
      for (const id of fallbackIds) {
        if (workouts[id]) {
          return workouts[id];
        }
      }
    }
    
    return workout;
  },

  // Start a new workout session
  async startWorkoutSession(workoutId, userId = 'user123') {
    const workout = await this.getWorkoutById(workoutId);
    if (!workout) throw new Error('Workout not found');

    const session = {
      id: `session_${Date.now()}`,
      workoutId,
      userId,
      startTime: new Date().toISOString(),
      status: 'in-progress',
      currentExerciseIndex: 0,
      completedExercises: [],
      exerciseProgress: workout.exercises.map(exercise => ({
        exerciseId: exercise.id,
        completed: false,
        sets: Array(exercise.sets).fill(null).map(() => ({
          completed: false,
          completedAt: null
        }))
      }))
    };

    // Store session (in real app, this would be saved to database)
    await AsyncStorage.setItem(`workout_session_${session.id}`, JSON.stringify(session));
    await AsyncStorage.setItem('current_workout_session', session.id);

    return session;
  },

  // Get current workout session
  async getCurrentSession() {
    try {
      const sessionId = await AsyncStorage.getItem('current_workout_session');
      if (!sessionId) return null;

      const sessionData = await AsyncStorage.getItem(`workout_session_${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  },

  // Update exercise progress
  async updateExerciseProgress(sessionId, exerciseIndex, setIndex, data) {
    try {
      const sessionData = await AsyncStorage.getItem(`workout_session_${sessionId}`);
      if (!sessionData) throw new Error('Session not found');

      const session = JSON.parse(sessionData);
      
      // Update the specific set
      session.exerciseProgress[exerciseIndex].sets[setIndex] = {
        ...session.exerciseProgress[exerciseIndex].sets[setIndex],
        completed: data.completed,
        completedAt: data.completed ? new Date().toISOString() : null
      };

      // Check if exercise is completed
      const exercise = session.exerciseProgress[exerciseIndex];
      const allSetsCompleted = exercise.sets.every(set => set.completed);
      if (allSetsCompleted && !exercise.completed) {
        exercise.completed = true;
        exercise.completedAt = new Date().toISOString();
        session.completedExercises.push(exercise.exerciseId);
      }

      // Check if workout is completed
      const allExercisesCompleted = session.exerciseProgress.every(ex => ex.completed);
      if (allExercisesCompleted) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
      }

      await AsyncStorage.setItem(`workout_session_${sessionId}`, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error updating exercise progress:', error);
      throw error;
    }
  },

  // Start rest timer for a set (simplified - just for reference)
  async startRestTimer(sessionId, exerciseIndex, setIndex) {
    try {
      // In the simplified version, we don't need to track individual rest times
      // This method is kept for compatibility but doesn't do anything
      return await this.getCurrentSession();
    } catch (error) {
      console.error('Error starting rest timer:', error);
      return null;
    }
  },

  // Complete workout session
  async completeWorkout(sessionId) {
    try {
      const sessionData = await AsyncStorage.getItem(`workout_session_${sessionId}`);
      if (!sessionData) throw new Error('Session not found');

      const session = JSON.parse(sessionData);
      session.status = 'completed';
      session.endTime = new Date().toISOString();

      await AsyncStorage.setItem(`workout_session_${sessionId}`, JSON.stringify(session));
      await AsyncStorage.removeItem('current_workout_session');

      // Update training data to reflect completion
      await this.updateTrainingProgress(session);

      return session;
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  },

  // Update training progress after workout completion
  async updateTrainingProgress(session) {
    try {
      // This would typically update your training stats in the database
      const existingData = await AsyncStorage.getItem('completed_workouts');
      const completedWorkouts = existingData ? JSON.parse(existingData) : [];
      
      completedWorkouts.push({
        workoutId: session.workoutId,
        sessionId: session.id,
        completedAt: session.endTime,
        duration: new Date(session.endTime) - new Date(session.startTime),
        exercises: session.completedExercises
      });
      
      await AsyncStorage.setItem('completed_workouts', JSON.stringify(completedWorkouts));
    } catch (error) {
      console.error('Error updating training progress:', error);
    }
  },

  // Check if workout was completed today
  async isWorkoutCompletedToday(workoutId) {
    try {
      const existingData = await AsyncStorage.getItem('completed_workouts');
      const completedWorkouts = existingData ? JSON.parse(existingData) : [];
      const today = new Date().toDateString();
      
      return completedWorkouts.some(workout => 
        workout.workoutId === workoutId && 
        new Date(workout.completedAt).toDateString() === today
      );
    } catch (error) {
      console.error('Error checking workout completion:', error);
      return false;
    }
  }
};
