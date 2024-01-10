import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';

const LanguageSelect = styled.select`
  display: inline;
  width: unset;
  height: calc(1rem * var(--line-height));
  padding-left: 1ch;
  margin-bottom: 0;
  background-color: unset;
  background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InZhcigtLWNvbG9yLWZvcmVncm91bmQpIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHBvbHlnb24gcG9pbnRzPSI1MCA1Ny4xMyAyMy4xOSAzMC40NiAxNi4xMyAzNy41NSA1MCA3MS4yMyA4My44NiAzNy41NSA3Ni44MSAzMC40NiA1MCA1Ny4xMyI+PC9wb2x5Z29uPjwvc3ZnPg==');
  background-position: calc(100% - calc(var(--margin) * 0.95)) 70%;
  border: unset;

  /* invert color of background-image in dark mode */
  @media (prefers-color-scheme: dark) {
    filter: brightness(0) invert(1);
  }
`;

function LanguageChooser() {
    const { i18n } = useTranslation();

    const preferredLanguage = useCallback((lang) => {
        // use the browser language if no language was selected before,
        // if this language is not available it will default to the first option of the select
        const preferredLanguage = lang || navigator.language.split('-')[0];
        // if the preferredLanguage is already selected we stop here
        if (preferredLanguage === i18n.language) return;

        // change selected language
        i18n.changeLanguage(preferredLanguage);
    }, [i18n]);

    const changeLanguage = (lang) => {
        localStorage.setItem('medienhaus_lang', lang); // save the default language to the local storage
        i18n.changeLanguage(lang);
    };

    useEffect(() => {
        let cancelled = false;

        if (!cancelled) {
            const localesSettings = localStorage.getItem('medienhaus_lang');
            preferredLanguage(localesSettings);
        }

        return () => cancelled = true;
    }, [preferredLanguage]);

    return (
        <>
            <LanguageSelect
                onChange={(e) => { changeLanguage(e.target.value); }}
                value={i18n.language}
            >
                <option value="en">en</option>
                <option value="de">de</option>
            </LanguageSelect>
        </>
    );
}

export default LanguageChooser;
