import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/UI/toast';
import { useToast } from '@/components/UI/use-toast';

export function Toaster() {
    const { toasts } = useToast();

    return (
        (<ToastProvider>
            { toasts.map(function({ id, title, description, action, ...props }) {
                return (
                    (<Toast key={id} {...props}>
                        <div className="tw-grid tw-gap-1">
                            { title && <ToastTitle>{ title }</ToastTitle> }
                            { description && (
                                <ToastDescription>{ description }</ToastDescription>
                            ) }
                        </div>
                        { action }
                        <ToastClose className="resetButtonStyle" />
                    </Toast>)
                );
            }) }
            <ToastViewport />
        </ToastProvider>)
    );
}
