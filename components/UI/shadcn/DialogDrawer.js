import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn, useMediaQuery } from '@/lib/utils';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/UI/shadcn/Drawer';
import { Dialog, DialogContent, DialogHeader } from '@/components/UI/shadcn/Dialog';
import { Button } from '@/components/UI/shadcn/Button';

/**
 * A dialog component that automatically becomes a drawer on mobile viewports.
 */
const DrawerDialog = React.forwardRef(({ className, children, isOpen, onOpenChange, ...props }, ref) => {
    const { t } = useTranslation();
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange} ref={ref}>
                <DialogContent className="max-h-[calc(100%-3rem)] max-w-[calc(767px-3rem)] overflow-y-auto">{children}</DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange} ref={ref}>
            <DrawerContent>
                <div className="px-4">{children}</div>
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline">{t('Cancel')}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
});
DrawerDialog.displayName = 'DrawerDialog';

const DrawerDialogHeader = React.forwardRef(({ className, children, ...props }, ref) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <DialogHeader ref={ref} props>
                {children}
            </DialogHeader>
        );
    }

    return (
        <DrawerHeader className={cn('-mx-4 text-left', props.className)} ref={ref} props>
            {children}
        </DrawerHeader>
    );
});
DrawerDialogHeader.displayName = 'DrawerDialogHeader';

export { DrawerDialog, DrawerDialogHeader };
