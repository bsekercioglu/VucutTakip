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

export const getCompositionStatus = (value: number, range: { min: number; max: number; optimal: number }) => {
  if (value < range.min) return { status: 'low', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  if (value > range.max) return { status: 'high', color: 'text-red-600', bgColor: 'bg-red-50' };
  if (Math.abs(value - range.optimal) <= 2) return { status: 'optimal', color: 'text-green-600', bgColor: 'bg-green-50' };
  return { status: 'normal', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
};