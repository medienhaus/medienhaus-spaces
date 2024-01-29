import { styled } from 'styled-components';

import DefaultLayout from '@/components/layouts/default';

const Wrapper = styled.div`
  display: grid;
  grid-auto-flow: row;
  grid-gap: 1rem;
  align-content: center;

  > div {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-gap: 1rem;
    align-items: center;

    > span {
      height: 100%;
    }
  }
`;

export default function Colors() {
    return (
        <DefaultLayout.LameColumn>
            <h2>/login</h2>
            <Wrapper>
                <div>
                    background:
                    <span style={{ backgroundColor: 'hsl(var(--background))' }} />
                </div>
                <div>
                    foreground:
                    <span style={{ backgroundColor: 'hsl(var(--foreground))' }} />
                </div>
                <div>
                    card:
                    <span style={{ backgroundColor: 'hsl(var(--card))' }} />
                </div>
                <div>
                    card-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--card-foreground))' }} />
                </div>
                <div>
                    popover:
                    <span style={{ backgroundColor: 'hsl(var(--popover))' }} />
                </div>
                <div>
                    popover-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--popover-foreground))' }} />
                </div>
                <div>
                    primary:
                    <span style={{ backgroundColor: 'hsl(var(--primary))' }} />
                </div>
                <div>
                    primary-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--primary-foreground))' }} />
                </div>
                <div>
                    secondary:
                    <span style={{ backgroundColor: 'hsl(var(--secondary))' }} />
                </div>
                <div>
                    secondary-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--secondary-foreground))' }} />
                </div>
                <div>
                    muted:
                    <span style={{ backgroundColor: 'hsl(var(--muted))' }} />
                </div>
                <div>
                    muted-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
                </div>
                <div>
                    accent:
                    <span style={{ backgroundColor: 'hsl(var(--accent))' }} />
                </div>
                <div>
                    accent-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--accent-foreground))' }} />
                </div>
                <div>
                    destructive:
                    <span style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                </div>
                <div>
                    destructive-foreground:
                    <span style={{ backgroundColor: 'hsl(var(--destructive-foreground))' }} />
                </div>
                <div>
                    border:
                    <span style={{ backgroundColor: 'hsl(var(--border))' }} />
                </div>
                <div>
                    input:
                    <span style={{ backgroundColor: 'hsl(var(--input))' }} />
                </div>
                <div>
                    ring:
                    <span style={{ backgroundColor: 'hsl(var(--ring))' }} />
                </div>
            </Wrapper>
        </DefaultLayout.LameColumn>
    );
}
