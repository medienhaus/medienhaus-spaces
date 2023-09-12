import React, { useState, useRef } from 'react';
import _ from 'lodash';

import { ServiceTable } from './ServiceTable';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @component
 * @param {string[]} options - An array of Objects for the datalist.
 * @callback onChange - function to execute when input changes
 * @callback onSelect - function to execute when a result from the datalist was selected
 * @param {Array} keysToDisplay - Array of strings of key values to be displayed as results
 * @returns {React.JSX.Element} The Datalist component.
 */

function Datalist({ options, onChange, onSelect, keysToDisplay }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    const handleChange = async (e) => {
        setIsLoading(true);
        setValue(e.target.value);
        onSelect(null);
        await onChange(e);
        if (e.target.value !== '') setIsOpen(true);
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        // Handle keyboard navigation
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                const newIndex = Math.min(selectedIndex + 1, options.length - 1);
                setSelectedIndex(newIndex);
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

            setValue(stringifySelection(selectedOption));
            onSelect(selectedOption);
            setSelectedIndex(-1);
            setIsOpen(false);
            inputRef.current.focus();
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsOpen(false);
            setSelectedIndex(-1);
        }, 100); // Delay closing the datalist to allow clicking on options
    };

    const handleListItemClick = (selectedOption) => {
        // Handle mouse interaction
        setValue(stringifySelection(selectedOption));
        onSelect(selectedOption);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current.focus();
    };

    const stringifySelection = (selectedOption) => {
        // maps over all entries in the keysToDisplay array and returns the corresponding values as a string if the key is found in the selected options
        let displayValue = _.map(selectedOption, (value, key) => {
            if (!keysToDisplay.includes(key)) return;

            return value;
        });
        displayValue = displayValue.filter((value) => value !== undefined).reverse().toString();

        return displayValue;
    };

    return (
        <div>
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
                    { options.map((option, index) => (
                        <ServiceTable.Row
                            key={index}
                            selected={selectedIndex === index}
                            onClick={() => handleListItemClick(option)}>
                            { keysToDisplay.map(key => {
                                return <ServiceTable.Cell
                                    key={key}>
                                    { option[key] }
                                </ServiceTable.Cell>;
                            }) }

                        </ServiceTable.Row>
                    )) }
                </ServiceTable>
            ) }
        </div>
    );
}

export default Datalist;
