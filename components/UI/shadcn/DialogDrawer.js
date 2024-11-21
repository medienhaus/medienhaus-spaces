import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn, useMediaQuery } from '@/lib/utils';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/UI/shadcn/Drawer';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from '@/components/UI/shadcn/Dialog';
import { Button } from '@/components/UI/shadcn/Button';

const isDesktopMediaQuery = '(min-width: 768px)';

/**
 * A dialog component that automatically becomes a drawer on mobile viewports.
 */
const DrawerDialog = React.forwardRef(({ className, children, isOpen, ...props }, ref) => {
    const isDesktop = useMediaQuery(isDesktopMediaQuery);

    if (isDesktop) {
        return (
            <Dialog open={isOpen} className={className} ref={ref} {...props}>
                <DialogContent className="max-h-[calc(100%-3rem)] max-w-[calc(767px-3rem)] overflow-y-auto">{children}</DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} className={className} ref={ref} {...props}>
            <DrawerContent>
                <div className="px-4 pb-4">{children}</div>
            </DrawerContent>
        </Drawer>
    );
});
DrawerDialog.displayName = 'DrawerDialog';

const DrawerDialogHeader = React.forwardRef(({ className, children, ...props }, ref) => {
    const isDesktop = useMediaQuery(isDesktopMediaQuery);

    if (isDesktop) {
        return (
            <DialogHeader className={className} ref={ref} {...props}>
                {children}
            </DialogHeader>
        );
    }

    return (
        <DrawerHeader className={cn('-mx-4 text-left', props.className)} ref={ref} {...props}>
            {children}
        </DrawerHeader>
    );
});
DrawerDialogHeader.displayName = 'DrawerDialogHeader';

const DrawerDialogFooter = React.forwardRef(({ className, cancelLabel, children, ...props }, ref) => {
    const { t } = useTranslation();
    const isDesktop = useMediaQuery(isDesktopMediaQuery);

    if (isDesktop) {
        return (
            <DialogFooter className={className} ref={ref} {...props}>
                <DialogClose ref={ref} asChild>
                    <Button variant="outline">{cancelLabel || t('Cancel')}</Button>
                </DialogClose>
                {children}
            </DialogFooter>
        );
    }

    return (
        <DrawerFooter className={cn('px-0', props.className)} ref={ref} {...props}>
            {children}
            <DrawerClose ref={ref} asChild>
                <Button variant="outline">{cancelLabel || t('Cancel')}</Button>
            </DrawerClose>
        </DrawerFooter>
    );
});
DrawerDialogFooter.displayName = 'DrawerDialogFooter';

export { DrawerDialog, DrawerDialogHeader, DrawerDialogFooter };
