import styled from 'styled-components';
import { ClipboardIcon } from '@remixicons/react/line';

import Button from '../../components/UI/Button';
import ButtonPrimary from '../../components/UI/ButtonPrimary';
import ButtonSecondary from '../../components/UI/ButtonSecondary';
import ButtonInlineIcon from '../../components/UI/ButtonInlineIcon';
import ButtonInlineText from '../../components/UI/ButtonInlineText';
import DefaultLayout from '../../components/layouts/default';
import Icon from '../../components/UI/Icon';

const Wrapper = styled.div`
  > * + * {
    margin-top: var(--margin);
  }
`;

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 50%);
  grid-gap: var(--margin);

  code {
    align-self: center;
    font-size: 80%;
  }

  > button {
    justify-self: center;
    width: fit-content;
  }
`;

export default function devButtons() {
    return (
        <DefaultLayout.LameColumn>
            <Wrapper>
                <Container>
                    <code>&lt;Button /&gt;</code>
                    <Button>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </Button>
                </Container>
                <Container>
                    <code>&lt;Button disabled /&gt;</code>
                    <Button disabled>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </Button>
                </Container>
                <Container>
                    <code>&lt;ButtonPrimary /&gt;</code>
                    <ButtonPrimary>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonPrimary>
                </Container>
                <Container>
                    <code>&lt;ButtonPrimary disabled /&gt;</code>
                    <ButtonPrimary disabled>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonPrimary>
                </Container>
                <Container>
                    <code>&lt;ButtonSecondary /&gt;</code>
                    <ButtonSecondary>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonSecondary>
                </Container>
                <Container>
                    <code>&lt;ButtonSecondary disabled /&gt;</code>
                    <ButtonSecondary disabled>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonSecondary>
                </Container>
                <Container>
                    <code>&lt;ButtonInlineText /&gt;</code>
                    <ButtonInlineText>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInlineText>
                </Container>
                <Container>
                    <code>&lt;ButtonInlineText disabled/&gt;</code>
                    <ButtonInlineText disabled>
                        🧩 HAMBURGEFONTSIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInlineText>
                </Container>
                <Container>
                    <code>&lt;ButtonInlineIcon /&gt;</code>
                    <ButtonInlineIcon>
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInlineIcon>
                </Container>
                <Container>
                    <code>&lt;ButtonInlineIcon disabled /&gt;</code>
                    <ButtonInlineIcon disabled>
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInlineIcon>
                </Container>
            </Wrapper>
        </DefaultLayout.LameColumn>
    );
}
