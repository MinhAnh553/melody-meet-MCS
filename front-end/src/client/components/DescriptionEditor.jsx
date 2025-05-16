import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const DescriptionEditor = ({ initialValue, onEditorChange }) => {
    const editorRef = useRef(null);
    const [content, setContent] = useState(initialValue);

    const handleEditorChange = useCallback(
        (newContent, editor) => {
            setContent(newContent);

            if (onEditorChange) {
                onEditorChange(newContent);
            }
        },
        [onEditorChange],
    );

    useEffect(() => {
        if (initialValue) {
            setContent(initialValue);
        }
    }, [initialValue]);

    return (
        <Editor
            apiKey="4q7adju40hir2jzg02ht5qegte2fy1n8262er9mhdtl5sf52"
            // onInit giúp lưu editor instance vào editorRef
            onInit={(evt, editor) => (editorRef.current = editor)}
            value={content}
            init={{
                height: 500,
                menubar: false,
                toolbar:
                    'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
            }}
            onEditorChange={handleEditorChange}
        />
    );
};

export default DescriptionEditor;
