import styled from 'styled-components';
import { ClipboardIcon } from '@remixicons/react/line';

import Button from '../../components/UI/buttons/_base';
import ButtonPrimary from '../../components/UI/buttons/ButtonPrimary';
import ButtonSecondary from '../../components/UI/buttons/ButtonSecondary';
import ButtonInline from '../../components/UI/buttons/ButtonInline';
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
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </Button>
                </Container>
                <Container>
                    <code>&lt;Button disabled /&gt;</code>
                    <Button disabled>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </Button>
                </Container>
                <Container>
                    <code>&lt;ButtonPrimary /&gt;</code>
                    <ButtonPrimary>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonPrimary>
                </Container>
                <Container>
                    <code>&lt;ButtonPrimary disabled /&gt;</code>
                    <ButtonPrimary disabled>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonPrimary>
                </Container>
                <Container>
                    <code>&lt;ButtonSecondary /&gt;</code>
                    <ButtonSecondary>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonSecondary>
                </Container>
                <Container>
                    <code>&lt;ButtonSecondary disabled /&gt;</code>
                    <ButtonSecondary disabled>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonSecondary>
                </Container>
                <Container>
                    <code>&lt;ButtonInline /&gt;</code>
                    <ButtonInline>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInline>
                </Container>
                <Container>
                    <code>&lt;ButtonInline disabled/&gt;</code>
                    <ButtonInline disabled>
                        🧩 HAMBURGEFONSTIV
                        <ClipboardIcon />
                        <Icon>
                            <ClipboardIcon />
                        </Icon>
                    </ButtonInline>
                </Container>
            </Wrapper>
        </DefaultLayout.LameColumn>
    );
}
