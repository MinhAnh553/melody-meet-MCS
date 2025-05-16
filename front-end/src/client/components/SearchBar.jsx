import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../util/api';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query) {
                searchEvents(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchEvents = async (searchQuery) => {
        try {
            const res = await api.search(searchQuery);
            if (res.success) {
                setResults(res.events);
                setShowResults(true);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    return (
        <div
            className="position-relative"
            style={{
                width: '40%',
            }}
        >
            <form className="d-flex search-form">
                <div className="input-group">
                    <span className="input-group-text">
                        <i className="bi bi-search" />
                    </span>
                    <input
                        className="form-control text-dark"
                        type="search"
                        placeholder="Tìm kiếm sự kiện"
                        aria-label="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        onBlur={() =>
                            setTimeout(() => setShowResults(false), 200)
                        }
                    />
                </div>
            </form>

            {showResults && results.length > 0 && (
                <ul
                    className="list-group position-absolute shadow rounded mt-1"
                    style={{
                        width: 'calc(100%)',
                        left: '60px',
                        maxHeight: '400px', // Giới hạn chiều cao
                        overflowY: 'auto', // Hiển thị thanh cuộn khi danh sách dài
                        zIndex: 10, // Đảm bảo danh sách hiển thị trên các phần tử khác
                    }}
                >
                    {results.map((event) => (
                        <li
                            key={event._id}
                            className="list-group-item"
                            style={{
                                backgroundColor: 'rgba(49, 53, 62, .55)',
                                color: 'white',
                                backdropFilter: 'blur(55px)',
                                border: 'none',
                            }}
                        >
                            <Link
                                to={`/event/${event._id}`}
                                className="d-flex align-items-center text-decoration-none fw-bold"
                            >
                                <img
                                    src={event.background}
                                    alt={event.name}
                                    className="me-2 rounded"
                                    style={{
                                        width: 'auto',
                                        height: '100px',
                                        objectFit: 'contain',
                                    }}
                                />
                                {event.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
