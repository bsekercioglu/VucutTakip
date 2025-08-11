export interface BodyCompositionRanges {
  bodyFat: { min: number; max: number; optimal: number };
  water: { min: number; max: number; optimal: number };
  muscle: { min: number; max: number; optimal: number };
}

export const getBodyCompositionRanges = (age: number, gender: 'male' | 'female'): BodyCompositionRanges => {
  if (gender === 'male') {
    if (age < 30) {
      return {
        bodyFat: { min: 8, max: 20, optimal: 14 },
        water: { min: 55, max: 65, optimal: 60 },
        muscle: { min: 40, max: 50, optimal: 45 }
      };
    } else if (age < 50) {
      return {
        bodyFat: { min: 11, max: 22, optimal: 16 },
        water: { min: 50, max: 60, optimal: 55 },
        muscle: { min: 35, max: 45, optimal: 40 }
      };
    } else {
      return {
        bodyFat: { min: 13, max: 25, optimal: 19 },
        water: { min: 45, max: 55, optimal: 50 },
        muscle: { min: 30, max: 40, optimal: 35 }
      };
    }
  } else {
    if (age < 30) {
      return {
        bodyFat: { min: 16, max: 30, optimal: 23 },
        water: { min: 50, max: 60, optimal: 55 },
        muscle: { min: 30, max: 40, optimal: 35 }
      };
    } else if (age < 50) {
      return {
        bodyFat: { min: 18, max: 33, optimal: 25 },
        water: { min: 45, max: 55, optimal: 50 },
        muscle: { min: 25, max: 35, optimal: 30 }
      };
    } else {
      return {
        bodyFat: { min: 20, max: 35, optimal: 27 },
        water: { min: 40, max: 50, optimal: 45 },
        muscle: { min: 20, max: 30, optimal: 25 }
      };
    }
  }
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// BMR (Basal Metabolic Rate) calculation using Mifflin-St Jeor Equation
export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Body Fat Percentage calculation using Navy Method
export const calculateBFP = (
  gender: 'male' | 'female',
  height: number, // cm
  waist: number, // cm
  neck: number, // cm
  hips?: number // cm (required for females)
): number => {
  // Convert cm to inches for the formula
  const heightInches = height / 2.54;
  const waistInches = waist / 2.54;
  const neckInches = neck / 2.54;
  
  if (gender === 'male') {
    const bfp = 495 / (1.0324 - 0.19077 * Math.log10(waistInches - neckInches) + 0.15456 * Math.log10(heightInches)) - 450;
    return Math.max(0, Math.min(50, bfp)); // Clamp between 0-50%
  } else {
    if (!hips) return 0;
    const hipsInches = hips / 2.54;
    const bfp = 495 / (1.29579 - 0.35004 * Math.log10(waistInches + hipsInches - neckInches) + 0.22100 * Math.log10(heightInches)) - 450;
    return Math.max(0, Math.min(50, bfp)); // Clamp between 0-50%
  }
};

// Get BFP status based on age and gender
export const getBFPStatus = (bfp: number, age: number, gender: 'male' | 'female') => {
  let ranges;
  
  if (gender === 'male') {
    if (age < 30) {
      ranges = { essential: 5, athlete: 10, fitness: 14, average: 18, obese: 25 };
    } else if (age < 50) {
      ranges = { essential: 5, athlete: 11, fitness: 16, average: 21, obese: 25 };
    } else {
      ranges = { essential: 5, athlete: 13, fitness: 19, average: 23, obese: 25 };
    }
  } else {
    if (age < 30) {
      ranges = { essential: 12, athlete: 16, fitness: 20, average: 25, obese: 32 };
    } else if (age < 50) {
      ranges = { essential: 12, athlete: 18, fitness: 23, average: 28, obese: 35 };
    } else {
      ranges = { essential: 12, athlete: 20, fitness: 25, average: 30, obese: 38 };
    }
  }
  
  if (bfp <= ranges.essential) return { status: 'essential', color: 'text-red-600', bgColor: 'bg-red-50', label: 'Temel Yağ' };
  if (bfp <= ranges.athlete) return { status: 'athlete', color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Sporcu' };
  if (bfp <= ranges.fitness) return { status: 'fitness', color: 'text-green-600', bgColor: 'bg-green-50', label: 'Fit' };
  if (bfp <= ranges.average) return { status: 'average', color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Ortalama' };
  if (bfp <= ranges.obese) return { status: 'above-average', color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Ortalamanın Üstü' };
  return { status: 'obese', color: 'text-red-600', bgColor: 'bg-red-50', label: 'Obez' };
};

export const getCompositionStatus = (value: number, range: { min: number; max: number; optimal: number }) => {
  if (value < range.min) return { status: 'low', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (value > range.max) return { status: 'high', color: 'text-red-600', bgColor: 'bg-red-50' };
  if (Math.abs(value - range.optimal) <= 2) return { status: 'optimal', color: 'text-green-600', bgColor: 'bg-green-50' };
  return { status: 'normal', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
};