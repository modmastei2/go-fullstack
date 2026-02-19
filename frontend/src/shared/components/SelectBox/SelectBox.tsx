import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import MenuItem from '@mui/material/MenuItem';

interface SelectOption {
    text: string;
    value: string;
    [key: string]: string;
}

interface SelectBoxProps {
    id: string;
    value: string;
    placeholder?: string;
    options: SelectOption[];
    cascading?: {
        depends_on: string;
        group_key: string;
    };
    showClearButton?: boolean;
    multiple?: boolean;
    parentValue?: string;
    disabled?: boolean;
    onChange: (id: string, value: string) => void;
    onClear: (id: string) => void;
}

export default function SelectBox({
    id,
    value,
    options,
    placeholder = 'Select an option',
    cascading,
    parentValue,
    disabled,
    showClearButton = false,
    multiple = false,
    onChange,
    onClear,
}: SelectBoxProps) {
    const filteredOptions = options.filter((option) => {
        if (cascading && cascading.depends_on && cascading.group_key) {
            return option[cascading.group_key] === parentValue;
        }
        return true;
    });
    const validValues = filteredOptions.map((option) => option.value);

    let safeValue: string | string[];
    if (multiple) {
        const values = value ? value.split(',') : [];
        safeValue = values.filter((v) => validValues.includes(v));
    } else {
        safeValue = validValues.includes(value) ? value : '';
    }

    console.log('SelectBox Render:', { id, value, safeValue, filteredOptions });

    return (
        <FormControl fullWidth size="small">
            <Select
                multiple={multiple}
                value={safeValue}
                disabled={disabled}
                onChange={(e) => onChange(id, multiple ? (e.target.value as string[]).join(',') : (e.target.value as string))}
                IconComponent={(iconProps) => {
                    const hasValue = multiple 
                        ? Array.isArray(safeValue) && safeValue.length > 0 
                        : !!safeValue;

                    if (hasValue && showClearButton) {
                        return (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClear(id);
                                }}>
                                <ClearIcon fontSize="small"></ClearIcon>
                            </IconButton>
                        );
                    } else {
                        return <ArrowDropDown {...iconProps} />;
                    }
                }}
                displayEmpty>
                {placeholder && (
                    <MenuItem disabled={showClearButton || multiple} value="">
                        {placeholder}
                    </MenuItem>
                )}

                {filteredOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.text}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
