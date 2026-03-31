export function getEmailFromRoll(rollNumber) {
  if (!rollNumber) return null
  var roll = rollNumber.toUpperCase()
  if (roll.includes("P3")) return roll.toLowerCase() + "@acet.ac.in"
  if (roll.includes("MH")) return roll.toLowerCase() + "@acoe.edu.in"
  if (roll.includes("A9")) return roll.toLowerCase() + "@aec.edu.in"
  return null
}

export function getCollegeFromRoll(rollNumber) {
  if (!rollNumber) return "Unknown"
  var roll = rollNumber.toUpperCase()
  if (roll.includes("P3")) return "ACET"
  if (roll.includes("MH")) return "ACOE"
  if (roll.includes("A9")) return "AEC"
  return "Unknown"
}
