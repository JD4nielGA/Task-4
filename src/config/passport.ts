import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel } from '../models/UserModel';
import { User } from '../models/UserModel';

const userModel = new UserModel();

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await userModel.findById(id);
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error, false);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await userModel.findByGoogleId(profile.id);
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user with Google profile
            const email = profile.emails?.[0]?.value || '';
            const username = profile.displayName || email.split('@')[0] || `google_${profile.id}`;
            
            user = await userModel.createGoogleUser(profile.id, email, username);
            return done(null, user);
            
        } catch (error) {
            console.error('Error in Google OAuth strategy:', error);
            return done(error, false);
        }
    }));
} else {
    console.warn('⚠️ Google OAuth credentials not found in environment variables');
    console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google authentication');
}

export default passport;