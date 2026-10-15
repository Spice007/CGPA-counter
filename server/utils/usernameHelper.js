/**
 * GVU Username Helper for SpiceCGPA Pro
 * Generates unique usernames for students completing registration in format:
 * <firstname>.gvu.ed (e.g. "John Doe" -> "john.gvu.ed")
 */

/**
 * Clean a string to alphanumeric lowercase characters
 */
function sanitizeNamePart(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a user has completed their student registration
 */
function isUserRegistrationComplete(user) {
    if (!user) return false;
    const isMissing = (v) => !v || typeof v !== 'string' || !v.trim() || 
                             v.trim().toUpperCase() === 'N/A' || 
                             v.trim().toLowerCase() === 'not set' ||
                             v.trim().toLowerCase() === 'undefined';

    if (isMissing(user.matricNumber)) return false;
    if (isMissing(user.department)) return false;
    if (isMissing(user.faculty)) return false;
    return true;
}

/**
 * Generates a unique .gvu.ed username for a user based on their first name.
 * Handles collisions gracefully (e.g. john.gvu.ed -> john1.gvu.ed -> john2.gvu.ed).
 *
 * @param {string} fullName - Full name of the user
 * @param {object} UserModel - Mongoose User model
 * @param {string|null} excludeUserId - Optional ID to ignore during unique check
 * @returns {Promise<string>} Generated unique username
 */
async function generateGvuUsername(fullName, UserModel, excludeUserId = null) {
    const rawFirst = (fullName || '').trim().split(/\s+/)[0] || 'student';
    let base = sanitizeNamePart(rawFirst);
    if (!base) base = 'student';

    const SUFFIX = '.gvu.ed';
    let candidate = `${base}${SUFFIX}`;
    let counter = 1;

    if (!UserModel) {
        return candidate;
    }

    // Ensure uniqueness in database
    while (true) {
        const query = { username: candidate };
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }

        try {
            const exists = await UserModel.findOne(query).select('_id').lean();
            if (!exists) {
                return candidate;
            }
        } catch (err) {
            // If DB query fails for any reason, return the candidate to avoid blocking
            return candidate;
        }

        candidate = `${base}${counter}${SUFFIX}`;
        counter++;
    }
}

module.exports = {
    generateGvuUsername,
    isUserRegistrationComplete,
    sanitizeNamePart
};
