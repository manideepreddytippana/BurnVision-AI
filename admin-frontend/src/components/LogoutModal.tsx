import { LogOut, X } from 'lucide-react'
import { Button } from './ui/button'

interface LogoutModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onCancel, onConfirm }: LogoutModalProps): JSX.Element | null {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in-0 duration-200">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            <div className="relative z-[1] w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="mx-4 bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="relative p-8 pb-6">
                        <button
                            onClick={onCancel}
                            className="absolute top-5 right-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                <LogOut className="w-7 h-7 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">
                                    Confirm Logout
                                </h3>
                                <p className="text-base text-muted-foreground mt-1.5">
                                    Are you sure you want to log out of your account?
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-8 py-5 bg-secondary/30 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="px-8 py-2.5 text-base border-border hover:bg-secondary hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onConfirm}
                            className="px-8 py-2.5 text-base bg-red-500 hover:bg-red-600 text-white border-0"
                        >
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
