export function dotProduct(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    console.log(`${vector1.length} - ${vector2.length}`);
    throw new Error("Vectors must have the same length");
  }

  let result = 0;
  for (let i = 0; i < vector1.length; i++) {
    result += vector1[i] * vector2[i];
  }

  return result;
}

export function SimilarityVector(a, b) {
  var magnitudeA = Math.sqrt(dotProduct(a, a));
  var magnitudeB = Math.sqrt(dotProduct(b, b));
  if (magnitudeA && magnitudeB)
    return dotProduct(a, b) / (magnitudeA * magnitudeB);
  else
    return false;
}

export function DistanceVectorEuclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export function SimilarityJaccard(str1="", str2="") {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}


export function DistanceLevenshtein(str1="", str2="") {
  const m = str1.length;
  const n = str2.length;
  
  // Create a 2D matrix to store the distances
  const distances = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Initialize the first row and column of the matrix
  for (let i = 1; i <= m; i++) {
    distances[i][0] = i;
  }
  
  for (let j = 1; j <= n; j++) {
    distances[0][j] = j;
  }
  
  // Calculate the minimum distances
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1];
      } else {
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,         // deletion
          distances[i][j - 1] + 1,         // insertion
          distances[i - 1][j - 1] + 1      // substitution
        );
      }
    }
  }
  
  // Return the minimum distance
  return distances[m][n];
}
