import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

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
 *
 * @TODO clear inputs on success
 */

const Row = styled(ServiceTable.Row)`
  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

export default function DataList({ options, onChange, onSelect, keysToDisplay }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState([]);
    const inputRef = useRef(null);

    const handleChange = async (e) => {
        setIsLoading(true);

        if (e.target.value !== '') setIsOpen(true);
        else {
            // if the input is empty we close the datalist
            setIsOpen(false);
        }

        if (!_.isEmpty(checked)) {
            setSelected(prevState => [...prevState, ...checked]);
            setChecked([]);
        }

        setValue(e.target.value);
        await onChange(e.target.value);

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
        // setTimeout(() => {
        //     // setIsOpen(false);
        //     // setSelectedIndex(-1);
        //     onSelect(checked);
        // }, 100); // Delay closing the datalist to allow clicking on options
    };

    const handleSelect = (selectedOption) => {
        onSelect(selectedOption); // Call onSelect immediately when an option is selected

        if (checked.includes(selectedOption)) setChecked(prevState => prevState.filter(state => state !== option));
        // Update the state (selected array) after calling onSelect
        else {
            setChecked(prevState => {
                if (checked.includes(selectedOption)) {
                    return prevState.filter(option => selectedOption !== option);
                } else {
                    return [...prevState, selectedOption];
                }
            });
        }

        inputRef.current.focus();
    };

    const handleRemove = (option) => {
        setChecked(prevState => prevState.filter(state => state !== option));
        setSelected(prevState => prevState.filter(state => state !== option));
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
            { (options.length > 0 || selected.length > 0) && (
                <ServiceTable>
                    <ServiceTable.Body>
                        { isOpen && options.filter(option => {
                            return !selected.some(select => _.isEqual(select, option));
                        }).map((option, index) => {
                            return <DataListRow
                                key={index}
                                option={option}
                                selectedIndex={selectedIndex}
                                index={index}
                                keysToDisplay={keysToDisplay}
                                handleSelect={handleSelect}
                                isChecked={checked.includes(option)}
                            />;
                        })
                        }
                        { selected.map((item, index) => <Row
                            key={index}
                            selected={selectedIndex === index}
                        >
                            <ServiceTable.Cell>
                                <input type="checkbox" checked onChange={() => handleRemove(item)} />
                            </ServiceTable.Cell>
                            { keysToDisplay.map((key, keyIndex) => {
                                return <ServiceTable.Cell
                                    key={key}>
                                    { item[key] }
                                </ServiceTable.Cell>;
                            }) }
                        </Row>) }
                    </ServiceTable.Body>
                </ServiceTable>
            ) }

        </>
    );
}

const DataListRow = ({ option, keysToDisplay, handleSelect, selectedIndex, index, isChecked }) => {
    const handleOnCheck = () => {
        handleSelect(option);
    };

    return <Row
        key={index}
        selected={selectedIndex === index}
    >
        <ServiceTable.Cell>
            <input id={index} type="checkbox" checked={isChecked} onChange={handleOnCheck} />
        </ServiceTable.Cell>
        { keysToDisplay.map((key, keyIndex) => {
            return <ServiceTable.Cell
                htmlFor={index}
                key={key}>
                { option[key] }
            </ServiceTable.Cell>;
        }) }
    </Row>;
};
