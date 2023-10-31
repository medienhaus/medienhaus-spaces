import React, { useState, useRef } from 'react';

import { ServiceTable } from './ServiceTable';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @component
 * @param {Object[]} options - An array of Objects for the datalist.
 * @param {function} onChange - function to execute when input changes, receives string as first parameter.
 * @param {function} onSelect - function to execute when a result from the datalist was selected
 * @param {Array} keysToDisplay - Array of strings of key values to be displayed as results
 * @returns {React.JSX.Element} The Datalist component.
 */

export default function Datalist({ options, onChange, onSelect, keysToDisplay }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    const handleChange = async (e) => {
        setIsLoading(true);
        setValue(e.target.value);
        await onChange(e.target.value);
        if (e.target.value !== '') setIsOpen(true);
        else {
            // if the input is empty we close the datalist
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        // Handle keyboard navigation
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setSelectedIndex(Math.min(selectedIndex + 1, options.length - 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                const newIndex = Math.max(selectedIndex - 1, -1);
                setSelectedIndex(newIndex);
            }
        } else if (e.key === 'Enter' && isOpen && selectedIndex !== -1) {
            e.preventDefault();
            const selectedOption = options[selectedIndex];
            handleSelect(selectedOption);
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsOpen(false);
            setSelectedIndex(-1);
        }, 100); // Delay closing the datalist to allow clicking on options
    };

    const handleSelect = (selectedOption) => {
        onSelect(selectedOption);
        setValue(stringifySelection(selectedOption));
        // setSelectedIndex(-1);
        // setIsOpen(false);
        inputRef.current.focus();
    };

    const stringifySelection = (selectedOption) => {
        return keysToDisplay
            .map((key) => selectedOption[key])
            .filter((value) => value !== undefined)
            .join(' (') + ')'; // wrap in brackets
    };

    return (
        <>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                ref={inputRef}
                disabled={isLoading}
            />
            { options.length > 0 && isOpen && (
                <ServiceTable>
                    <ServiceTable.Body>
                        { options.map((option, index) => (
                            <ServiceTable.Row
                                onClick={() => handleSelect(option)}
                                key={index}
                                selected={selectedIndex === index}
                            >
                                { keysToDisplay.map((key, keyIndex) => {
                                    return <ServiceTable.Cell
                                        key={key}>
                                        { keyIndex === 0 && selectedIndex === index && '→ ' }
                                        { option[key] }
                                    </ServiceTable.Cell>;
                                }) }
                            </ServiceTable.Row>
                        )) }
                    </ServiceTable.Body>
                </ServiceTable>
            ) }
        </>
    );
}
