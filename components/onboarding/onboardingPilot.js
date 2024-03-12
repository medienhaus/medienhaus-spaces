import { useTranslation } from 'react-i18next';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';

const OnboardingPilot = () => {
    const onboarding = useOnboarding();

    const { t } = useTranslation('onboarding');
    const size = onboarding?.size;

    return (
        <>
            {onboarding?.active && (
                <Sheet open={onboarding?.opened} onOpenChange={onboarding?.setOpened} modal={false}>
                    <SheetContent
                        side={size}
                        onInteractOutside={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <SheetHeader>
                            <Button
                                onClick={() => {
                                    onboarding?.setSize(size === 'onboardingBottomRight' ? 'onboardingMinimized' : 'onboardingBottomRight');
                                }}
                            >
                                {size === 'onboardingBottomRight' ? '\u035F' : '⌅'}
                            </Button>
                            <SheetTitle>
                                {onboarding?.currentRoute} — {onboarding?.currentStepTitle}
                            </SheetTitle>
                            <SheetDescription>{onboarding?.currentStepDescription}</SheetDescription>
                        </SheetHeader>

                        <SheetFooter className="mt-8 grid grid-cols-2 gap-4">
                            <Button
                                disabled={!onboarding?.hasPrev}
                                onClick={() => {
                                    onboarding.processStep(-1);
                                }}
                            >
                                {t('prev')}
                            </Button>
                            {onboarding?.active && onboarding?.hasNext && (
                                <Button
                                    disabled={!onboarding?.hasNext}
                                    onClick={() => {
                                        onboarding.processStep(1);
                                    }}
                                >
                                    {t('next')}
                                </Button>
                            )}

                            {onboarding?.active && !onboarding?.hasNext && onboarding?.nextRouteName.length > 0 && (
                                <Button
                                    onClick={() => {
                                        onboarding?.nextRoute();
                                    }}
                                >
                                    {'\uE1D8'} {onboarding?.nextRouteName}
                                </Button>
                            )}
                            {onboarding?.active && !onboarding?.hasNext && !onboarding?.nextRouteName.length > 0 && (
                                <Button
                                    onClick={() => {
                                        onboarding?.exit();
                                    }}
                                >
                                    {t('close')}
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
