import React, { useState, useEffect } from 'react';
import {
    Link,
    useNavigate,
    useSearchParams,
    useLocation,
} from 'react-router-dom';
import api from '../../util/api';

const SearchBar = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const initialQuery = searchParams.get('query') || '';
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

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

    // Reset showResults when navigating to search page
    useEffect(() => {
        if (location.pathname === '/search') {
            setShowResults(false);
        }
    }, [location.pathname, initialQuery]);

    const searchEvents = async (searchQuery) => {
        try {
            const res = await api.search(searchQuery);
            if (res.success) {
                setResults(res.events);
                if (location.pathname !== '/search') {
                    setShowResults(true);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?query=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div
            className="position-relative"
            style={{
                width: '40%',
            }}
        >
            <form className="d-flex search-form" onSubmit={handleSubmit}>
                <div className="input-group">
                    <span
                        className="input-group-text"
                        style={{ cursor: 'pointer' }}
                        onClick={handleSubmit}
                    >
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
                        onBlur={() => {
                            // Delay để cho phép click trên Link được xử lý trước
                            setTimeout(() => setShowResults(false), 150);
                        }}
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
                            onClick={() => setShowResults(false)}
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
