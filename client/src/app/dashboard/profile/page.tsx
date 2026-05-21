'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { 
    User, 
    Mail, 
    Hash, 
    School, 
    Building2, 
    Save, 
    Loader2,
    ShieldCheck,
    Camera,
    X,
    Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        matricNumber: '',
        department: '',
        faculty: '',
        profilePicture: ''
    });

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const { data } = await userService.getProfile();
            return data;
        }
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || '',
                email: profile.email || '',
                matricNumber: profile.matricNumber || '',
                department: profile.department || '',
                faculty: profile.faculty || '',
                profilePicture: profile.profilePicture || ''
            });
        }
    }, [profile]);

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast.error("Unable to access camera");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsCameraOpen(false);
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                // Flip the context horizontally for a mirror effect on the captured image
                context.translate(canvasRef.current.width, 0);
                context.scale(-1, 1);
                context.drawImage(videoRef.current, 0, 0);
                const imageUrl = canvasRef.current.toDataURL('image/jpeg');
                setFormData({ ...formData, profilePicture: imageUrl });
                stopCamera();
            }
        }
    };

    const updateMutation = useMutation({
        mutationFn: (data: any) => userService.updateProfile(data),
        onSuccess: () => {
            toast.success('Profile updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-primary" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold font-outfit mb-2">My Profile</h1>
                    <p className="text-gray-400">Manage your personal and academic information.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <div className="glass-card text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
                            <div className="relative pt-8 pb-4">
                                <div className="relative inline-block mb-4">
                                    <div className="w-24 h-24 rounded-full bg-dark-bg border-4 border-white/10 flex items-center justify-center text-primary mx-auto overflow-hidden">
                                        {formData.profilePicture ? (
                                            <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                        <button 
                                            type="button"
                                            onClick={() => setIsSelectionModalOpen(true)}
                                            title="Update Profile Picture"
                                            className="p-2 bg-primary rounded-full text-white hover:bg-primary-hover transition-colors shadow-lg"
                                        >
                                            <Camera size={14} />
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={(e) => {
                                                handleFileUpload(e);
                                                setIsSelectionModalOpen(false);
                                            }} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold">{profile?.fullName}</h3>
                                <p className="text-sm text-gray-400">{profile?.email}</p>
                            </div>
                            <div className="flex justify-around border-t border-white/5 py-4 mt-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Matric</p>
                                    <p className="font-mono text-sm">{profile?.matricNumber}</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card border-l-4 border-primary">
                            <div className="flex gap-3 items-center text-primary mb-3">
                                <ShieldCheck size={20} />
                                <h4 className="font-bold text-sm">Account Status</h4>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Your account is verified and linked to your institution. All data is encrypted and secure.
                            </p>
                        </div>
                    </motion.div>

                    {/* Edit Form */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        <form onSubmit={handleSubmit} className="glass-card space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <User size={14} /> Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-field w-full"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        className="input-field w-full"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Hash size={14} /> Matric Number
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-field w-full font-mono"
                                        value={formData.matricNumber}
                                        onChange={(e) => setFormData({...formData, matricNumber: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <School size={14} /> Faculty
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-field w-full"
                                        value={formData.faculty}
                                        onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={14} /> Department
                                    </label>
                                    <input 
                                        type="text" 
                                        className="input-field w-full"
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={updateMutation.isPending}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* Selection Modal */}
            {isSelectionModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-dark-surface p-6 rounded-2xl max-w-sm w-full relative border border-white/10 shadow-2xl text-center">
                        <button 
                            type="button"
                            onClick={() => setIsSelectionModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-2">Update Profile Picture</h3>
                        <p className="text-sm text-gray-400 mb-6">Do you want to add a picture or take a picture?</p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsSelectionModalOpen(false);
                                    fileInputRef.current?.click();
                                }}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white transition-colors"
                            >
                                <Upload size={18} /> Upload Image
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsSelectionModalOpen(false);
                                    startCamera();
                                }}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-primary hover:bg-primary-hover rounded-xl text-white transition-colors"
                            >
                                <Camera size={18} /> Take Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-dark-surface p-6 rounded-2xl max-w-lg w-full relative border border-white/10 shadow-2xl">
                        <button 
                            type="button"
                            onClick={stopCamera}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold mb-4">Take Profile Picture</h3>
                        <div className="rounded-xl overflow-hidden bg-black aspect-video mb-6 relative">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            ></video>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button 
                                type="button"
                                onClick={stopCamera}
                                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={captureImage}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Camera size={20} /> Capture
                            </button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
