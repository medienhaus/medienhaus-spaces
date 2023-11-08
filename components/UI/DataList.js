import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { ServiceTable } from './ServiceTable';
import Form from './Form';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @param {Object[]} options - An array of Objects for the datalist.
 * @param {function} onInputChange - Function to execute when input changes, receives string as the first parameter.
 * @param {function} onSubmit - Function to execute when the form is submitted, receives an array of selected options.
 * @param {Array} keysToDisplay - Array of strings of key values to be displayed as results.
 *
 * @returns {React.JSX.Element} - The Datalist component.
 */

const Row = styled(ServiceTable.Row)`
  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

const InviteUserForm = styled(Form)`
  display: grid;
  height: 100%;

  > :last-child {
    align-self: end;
  }
`;

export default function DataList({ options, onInputChange, keysToDisplay, onSubmit }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState([]);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const inputRef = useRef(null);

    const { t } = useTranslation();

    useEffect(() => {
        setFilteredOptions(options.filter(option => {
            return !selected.some(select => _.isEqual(select, option));
        }));
    }, [options, selected]);

    const handleChange = async (e) => {
        if (e.target.value !== '') setIsOpen(true);
        else {
            // if the input is empty we close the datalist
            setIsOpen(false);
        }

        setSelectedIndex(-1);

        if (!_.isEmpty(checked)) {
            // if an option was checked we update the selected array here.
            // This has the benefit that options don't immediately jump to the bottom when they are being selected,
            // only when the input changes will a checked option jump to the bottom
            setSelected(prevState => [...prevState, ...checked]);
            setChecked([]);
        }

        setValue(e.target.value);
        await onInputChange(e.target.value);
    };

    const handleKeyDown = (e) => {
        // Handle keyboard navigation when options are available
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setSelectedIndex(Math.min(selectedIndex + 1, options.length - 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (isOpen) {
                const newIndex = Math.max(selectedIndex - 1, -1);
                if (newIndex === -1) inputRef.current.focus();
                setSelectedIndex(newIndex);
            }
        } else if (e.key === 'Enter' && isOpen && selectedIndex !== -1) {
            e.preventDefault();
            handleSelect(filteredOptions[selectedIndex]);
        }
    };

    const handleSelect = (selectedOption) => {
        // if a user wants to uncheck an option which is inside the selected array,
        // selectedIndex will be bigger than the amount of entries within filteredOptions
        if (selectedIndex > filteredOptions.length -1) {
            setSelected(prevState => prevState.filter((option, index) => {
                return selectedIndex - filteredOptions.length !== index;
            }));

            return;
        }

        setChecked(prevState => {
            if (checked.includes(selectedOption)) {
                // remove option if it is changing from checked to unchecked (therefore already inside the `checked` array
                return prevState.filter(option => selectedOption !== option);
            } else {
                // otherwise add option to the array
                return [...prevState, selectedOption];
            }
        });
        // inputRef.current.focus();
    };

    const handleRemove = (option) => {
        setChecked(prevState => prevState.filter(state => state !== option));
        setSelected(prevState => prevState.filter(state => state !== option));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setChecked([]);
        setSelected([]);
        setIsOpen(false);
        await onSubmit(checked.concat(selected));
    };

    return (
        <InviteUserForm onSubmit={handleSubmit}>
            <>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setSelectedIndex(-1)}
                    ref={inputRef}
                />
                { (options.length > 0 || selected.length > 0) && (
                    <ServiceTable>
                        <ServiceTable.Body>
                            { isOpen && filteredOptions.map((option, index) => {
                                return <DataListRow
                                    key={index}
                                    option={option}
                                    focus={selectedIndex === index}
                                    index={index}
                                    keysToDisplay={keysToDisplay}
                                    handleSelect={handleSelect}
                                    isChecked={checked.includes(option)}
                                    handleKeyDown={handleKeyDown}
                                    setSelectedIndex={setSelectedIndex}
                                    // ref={checkboxRef}
                                />;
                            })
                            }
                            { selected.map((item, index) => {
                                return (
                                    <Row
                                        key={index}
                                        // we need to add the number of options to the index to highlight the correct item in the list
                                        // and not have multiple items show up as selected
                                        selected={selectedIndex === index + filteredOptions.length}
                                    >
                                        <ServiceTable.Cell>
                                            <input type="checkbox" checked onChange={() => handleRemove(item)} />
                                        </ServiceTable.Cell>
                                        { keysToDisplay.map((key) => {
                                            return <ServiceTable.Cell
                                                key={key}>
                                                { item[key] }
                                            </ServiceTable.Cell>;
                                        }) }
                                    </Row>);
                            }) }
                        </ServiceTable.Body>
                    </ServiceTable>
                ) }
                <button disabled={selected.length === 0 && checked.length === 0}>{ t('invite') }</button>
            </>
        </InviteUserForm>
    );
}

const DataListRow = ({ option, keysToDisplay, handleSelect, index, isChecked, handleKeyDown, focus, setSelectedIndex }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (focus && ref.current) {
            ref.current.focus();
        }
    }, [focus]);

    const handleOnCheck = () => {
        handleSelect(option);
    };

    return (
        <Row
            key={index}
            selected={focus}
            onKeyDown={handleKeyDown} // Add onKeyDown event

        >
            <ServiceTable.Cell>
                <input
                    id={index}
                    ref={ref}
                    tabIndex={0}
                    type="checkbox"
                    checked={isChecked}
                    onFocus={() => setSelectedIndex(index)}
                    onChange={handleOnCheck}
                    onClick={() => {
                        // make sure element gets deselected on mouse press
                        if (focus) setSelectedIndex(-1);
                    }}
                />
            </ServiceTable.Cell>
            { keysToDisplay.map((key) => {
                return (
                    <ServiceTable.Cell
                        htmlFor={index}
                        key={key}
                    >
                        { option[key] }
                    </ServiceTable.Cell>
                );
            }) }
        </Row>
    );
};
