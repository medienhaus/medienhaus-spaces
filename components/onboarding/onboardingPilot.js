import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';

const OnboardingPilot = () => {
    const onboarding = useOnboarding();

    const size = onboarding?.size;

    return (
        <>
            {onboarding?.active && (
                <Sheet open={onboarding?.opened} onOpenChange={onboarding?.setOpened} modal={false}>
                    <SheetContent side={size}>
                        <SheetHeader>
                            <Button
                                onClick={() => {
                                    onboarding?.setSize(size === 'bottomRight' ? 'minimized' : 'bottomRight');
                                }}
                            >
                                {size === 'bottomRight' ? '\u035F' : '⌅'}
                            </Button>
                            <SheetTitle>
                                {onboarding?.currentRoute} — {onboarding?.currentStepTitle}
                            </SheetTitle>
                            <SheetDescription>{onboarding?.currentStepDescription}</SheetDescription>
                        </SheetHeader>

                        <SheetFooter>
                            <Button
                                disabled={!onboarding?.hasPrev}
                                onClick={() => {
                                    onboarding.processStep(-1);
                                }}
                            >
                                prev
                            </Button>
                            {onboarding?.active && onboarding?.hasNext && (
                                <Button
                                    disabled={!onboarding?.hasNext}
                                    onClick={() => {
                                        onboarding.processStep(1);
                                    }}
                                >
                                    next
                                </Button>
                            )}

                            {onboarding?.active && !onboarding?.hasNext && onboarding?.nextRouteName.length > 0 && (
                                <Button
                                    onClick={() => {
                                        onboarding?.nextRoute();
                                    }}
                                >
                                    continue with {onboarding?.nextRouteName}
                                </Button>
                            )}
                            {onboarding?.active && !onboarding?.hasNext && !onboarding?.nextRouteName.length > 0 && (
                                <Button
                                    onClick={() => {
                                        onboarding?.exit();
                                    }}
                                >
                                    exit Onboarding
                                </Button>
                            )}
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
};

export default OnboardingPilot;
