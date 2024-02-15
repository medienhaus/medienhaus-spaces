import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
    'my-2 w-fit rounded-lg border p-2 [&>svg]:mr-2 [&>svg]:inline [&>svg]:leading-[var(--icon-size)] [&>svg]:text-foreground',
    {
        variants: {
            variant: {
                default: 'bg-background text-foreground',
                destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
    <span ref={ref} className={cn('align-middle', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };
