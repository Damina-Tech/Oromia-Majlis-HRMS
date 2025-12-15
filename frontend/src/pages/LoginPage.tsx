import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Building2, Chrome, Facebook, Loader2, Mail, AlertCircle } from 'lucide-react';
import { forgotPassword, loginWithGoogle, loginWithFacebook } from '@/services/auth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the HRMS dashboard!"
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // For now, redirect to Google OAuth or use a popup
      // In production, implement proper Google OAuth flow
      const googleAuthUrl = `${process.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/google/redirect`;
      
      // Open Google OAuth in a popup
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        googleAuthUrl,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setIsLoading(false);
        }
      }, 1000);

      // For demo: Show message that OAuth needs configuration
      toast({
        title: "Google OAuth",
        description: "Google OAuth is not yet configured. Please use email/password login.",
        variant: "default"
      });
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Google Login",
        description: error?.response?.data?.message || "Google OAuth is not configured. Please use email/password login.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // For now, show message that Facebook OAuth needs configuration
      // In production, implement proper Facebook OAuth flow
      toast({
        title: "Facebook OAuth",
        description: "Facebook OAuth is not yet configured. Please use email/password login.",
        variant: "default"
      });
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Facebook Login",
        description: error?.response?.data?.message || "Facebook OAuth is not configured. Please use email/password login.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const result = await forgotPassword(forgotPasswordEmail);
      setForgotPasswordSent(true);
      toast({
        title: "Reset Link Sent",
        description: result.message || "If an account with that email exists, a password reset link has been sent.",
      });
      
      // In development, show the reset link
      if (result.resetLink) {
        console.log('Reset link:', result.resetLink);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to send reset link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4" data-id="0v4to7nyx" data-path="src/pages/LoginPage.tsx">
      <div className="w-full max-w-md space-y-8" data-id="hjwo2jiph" data-path="src/pages/LoginPage.tsx">
        {/* Logo and Header */}
        <div className="text-center" data-id="oq8qgjhxk" data-path="src/pages/LoginPage.tsx">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4" data-id="wkufmetdd" data-path="src/pages/LoginPage.tsx">
            <Building2 className="h-8 w-8 text-white" data-id="famyievx9" data-path="src/pages/LoginPage.tsx" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" data-id="5gnil7qud" data-path="src/pages/LoginPage.tsx">Chiro HRMS Portal</h1>
          <p className="text-gray-600 mt-2" data-id="51tyo77m1" data-path="src/pages/LoginPage.tsx">Sign in to your account</p>
        </div>

        <Card className="shadow-lg" data-id="nn7m6b787" data-path="src/pages/LoginPage.tsx">
          <CardHeader data-id="p34dd2tkz" data-path="src/pages/LoginPage.tsx">
            <CardTitle data-id="q4zut3pka" data-path="src/pages/LoginPage.tsx">Sign In</CardTitle>
            <CardDescription data-id="uhnm8n78z" data-path="src/pages/LoginPage.tsx">
              Enter your credentials to access the Chiro HRMS system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-id="1mt5nb4b9" data-path="src/pages/LoginPage.tsx">
            {/* Demo Credentials */}
            {/* <div className="bg-blue-50 p-3 rounded-lg text-sm" data-id="vd6ukug4y" data-path="src/pages/LoginPage.tsx">
              <p className="font-medium text-blue-800 mb-1" data-id="fyvkn5g5t" data-path="src/pages/LoginPage.tsx">Demo Credentials:</p>
              <p className="text-blue-700" data-id="xx14ho2u4" data-path="src/pages/LoginPage.tsx">Admin: admin@ciro.gov.et / Admin12345!</p>
              <p className="text-blue-700" data-id="woeu2rnkp" data-path="src/pages/LoginPage.tsx">Manager: manager@ciro.gov.et / Manager123!</p>
            </div> */}

            <form onSubmit={handleLogin} className="space-y-4" data-id="1x51ohzy6" data-path="src/pages/LoginPage.tsx">
              <div className="space-y-2" data-id="oc9bic79t" data-path="src/pages/LoginPage.tsx">
                <Label htmlFor="email" data-id="ak6ipegz9" data-path="src/pages/LoginPage.tsx">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required data-id="8xsfc7dqu" data-path="src/pages/LoginPage.tsx" />

              </div>

              <div className="space-y-2" data-id="gwo3x3x9j" data-path="src/pages/LoginPage.tsx">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" data-id="rp93tcyml" data-path="src/pages/LoginPage.tsx">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required data-id="rmlfit5na" data-path="src/pages/LoginPage.tsx" />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                disabled={isLoading} data-id="dgejjhlyd" data-path="src/pages/LoginPage.tsx">

                {isLoading ?
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-id="634u1we1q" data-path="src/pages/LoginPage.tsx" />
                    Signing in...
                  </> :

                'Sign In'
                }
              </Button>
            </form>

            <div className="relative" data-id="39vr6tka9" data-path="src/pages/LoginPage.tsx">
              <div className="absolute inset-0 flex items-center" data-id="jy0eh57o0" data-path="src/pages/LoginPage.tsx">
                <Separator data-id="3lxc7w1s9" data-path="src/pages/LoginPage.tsx" />
              </div>
              <div className="relative flex justify-center text-xs uppercase" data-id="uh8p4nfjs" data-path="src/pages/LoginPage.tsx">
                <span className="bg-white px-2 text-gray-500" data-id="taiifdb6t" data-path="src/pages/LoginPage.tsx">Or continue with</span>
              </div>
            </div>

            {/* SSO Options */}
            <div className="grid grid-cols-2 gap-3" data-id="ax7stvxh3" data-path="src/pages/LoginPage.tsx">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full" data-id="6e89gyfmb" data-path="src/pages/LoginPage.tsx">
                <Chrome className="mr-2 h-4 w-4" data-id="vjje5dx6h" data-path="src/pages/LoginPage.tsx" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={isLoading}
                className="w-full" data-id="yt8gxoeao" data-path="src/pages/LoginPage.tsx">
                <Facebook className="mr-2 h-4 w-4" data-id="rry97zjba" data-path="src/pages/LoginPage.tsx" />
                Facebook
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600" data-id="qq3kgxghm" data-path="src/pages/LoginPage.tsx">
              <p data-id="0s4kaouu2" data-path="src/pages/LoginPage.tsx">Don't have an account? Contact your administrator</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500" data-id="7bfqzi4e3" data-path="src/pages/LoginPage.tsx">
          <p data-id="rsplyivqd" data-path="src/pages/LoginPage.tsx">© 2025 Chiro HRMS Portal. All rights reserved.</p>
          <p data-id="5nmpf7z9b" data-path="src/pages/LoginPage.tsx">Powered by Damina Tech</p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          {forgotPasswordSent ? (
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  If an account with that email exists, a password reset link has been sent to your email.
                  Please check your inbox and follow the instructions to reset your password.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordSent(false);
                  setForgotPasswordEmail('');
                }}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={forgotPasswordLoading}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail('');
                  }}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotPasswordLoading}>
                  {forgotPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>);

};

export default LoginPage;