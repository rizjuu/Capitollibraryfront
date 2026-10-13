import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RotateCcw,
  Barcode,
  Book,
  User,
  Tag,
  Layers,
  Calendar,
  Building,
  Hash,
  Activity,
  Loader2
} from "lucide-react";
import api from "../api";

function AddBook({ onBookAdded, showToast }) {
  const getTodayString = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    isbn: "",
    barcode: "",
    title: "",
    author: "",
    section: "Circulation Section (includes Fiction Books & Children's Corner)",
    category: "",
    publisher: "",
    publicationYear: "",
    shelf: "",
    status: "available",
    dateAdded: getTodayString()
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClear = () => {
    setFormData({
      isbn: "",
      barcode: "",
      title: "",
      author: "",
      section: "Circulation Section (includes Fiction Books & Children's Corner)",
      category: "",
      publisher: "",
      publicationYear: "",
      shelf: "",
      status: "available",
      dateAdded: getTodayString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.barcode.trim() || !formData.title.trim() || !formData.author.trim()) {
      if (showToast) {
        showToast("Please fill in Barcode, Title, and Author fields.", "error");
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        isbn: formData.isbn.trim(),
        barcode: formData.barcode.trim(),
        title: formData.title.trim(),
        author: formData.author.trim(),
        section: formData.section.trim() || "Circulation Section (includes Fiction Books & Children's Corner)",
        category: formData.category.trim() || "General",
        publisher: formData.publisher.trim() || "N/A",
        publicationYear: formData.publicationYear ? Number(formData.publicationYear) : null,
        shelf: formData.shelf.trim() || "General Shelf",
        status: formData.status || "available",
        dateAdded: formData.dateAdded || getTodayString()
      };

      const response = await api.post("/books", payload);

      if (showToast) {
        showToast(`Book "${formData.title.trim()}" registered into catalog with all 10 fields!`, "success");
      }
      handleClear();
      if (onBookAdded) onBookAdded(response.data);
    } catch (error) {
      console.error("Failed to add book:", error);
      if (showToast) {
        showToast(
          error.response?.data?.message || "Failed to add book to catalog. Check if barcode is unique.",
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, cubicBezier: [0.16, 1, 0.3, 1] }}
    >
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Add New Book</h1>
          <p className="page-subtitle">Register a new book into the library collection with complete 10-field metadata.</p>
        </div>
      </div>

      <div className="addbook-wrapper">
        <div className="addbook-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2col">
              {/* 1. ISBN */}
              <div className="form-group">
                <label className="form-label" htmlFor="isbn">
                  <Hash size={16} className="w-4 h-4" />
                  ISBN
                </label>
                <input
                  id="isbn"
                  name="isbn"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9780141182605"
                  value={formData.isbn}
                  onChange={handleChange}
                />
              </div>

              {/* 2. Barcode */}
              <div className="form-group">
                <label className="form-label" htmlFor="barcode">
                  <Barcode size={16} className="w-4 h-4" />
                  Barcode *
                </label>
                <input
                  id="barcode"
                  name="barcode"
                  type="text"
                  className="form-input"
                  placeholder="e.g. LIB-2026-001"
                  value={formData.barcode}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 3. Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  <Book size={16} className="w-4 h-4" />
                  Book Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. The Great Gatsby"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 4. Author */}
              <div className="form-group">
                <label className="form-label" htmlFor="author">
                  <User size={16} className="w-4 h-4" />
                  Author *
                </label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  className="form-input"
                  placeholder="e.g. F. Scott Fitzgerald"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Library Section (Official Capitol Library Sectioning) */}
              <div className="form-group">
                <label className="form-label" htmlFor="section">
                  <Layers size={16} className="w-4 h-4" />
                  Library Section *
                </label>
                <select
                  id="section"
                  name="section"
                  className="form-input"
                  value={formData.section}
                  onChange={handleChange}
                  required
                >
                  <option value="Filipiniana Section">Filipiniana Section</option>
                  <option value="Reserved Section (M.R. Books)">Reserved Section (M.R. Books)</option>
                  <option value="Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)">Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)</option>
                  <option value="Circulation Section (includes Fiction Books & Children's Corner)">Circulation Section (includes Fiction Books & Children's Corner)</option>
                  <option value="Reference Section (Includes Theses & Dissertations)">Reference Section (Includes Theses & Dissertations)</option>
                  <option value="Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)">Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)</option>
                </select>
              </div>

              {/* 5. Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="category">
                  <Tag size={16} className="w-4 h-4" />
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fiction, Classics, Science"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>

              {/* 6. Publisher */}
              <div className="form-group">
                <label className="form-label" htmlFor="publisher">
                  <Building size={16} className="w-4 h-4" />
                  Publisher
                </label>
                <input
                  id="publisher"
                  name="publisher"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Penguin Books, HarperCollins"
                  value={formData.publisher}
                  onChange={handleChange}
                />
              </div>

              {/* 7. Publication Year */}
              <div className="form-group">
                <label className="form-label" htmlFor="publicationYear">
                  <Calendar size={16} className="w-4 h-4" />
                  Publication Year
                </label>
                <input
                  id="publicationYear"
                  name="publicationYear"
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1925"
                  value={formData.publicationYear}
                  onChange={handleChange}
                  min="1000"
                  max="2030"
                />
              </div>

              {/* 8. Shelf Location */}
              <div className="form-group">
                <label className="form-label" htmlFor="shelf">
                  <Layers size={16} className="w-4 h-4" />
                  Shelf Location
                </label>
                <input
                  id="shelf"
                  name="shelf"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shelf A-01, Section 2"
                  value={formData.shelf}
                  onChange={handleChange}
                />
              </div>

              {/* 9. Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="status">
                  <Activity size={16} className="w-4 h-4" />
                  Catalog Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-input select-field"
                  value={formData.status}
                  onChange={handleChange}
                  style={{ width: "100%", height: "42px" }}
                >
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              {/* 10. Date Added */}
              <div className="form-group">
                <label className="form-label" htmlFor="dateAdded">
                  <Calendar size={16} className="w-4 h-4" />
                  Date Added
                </label>
                <input
                  id="dateAdded"
                  name="dateAdded"
                  type="date"
                  className="form-input"
                  value={formData.dateAdded}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions" style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="w-5 h-5 animate-spin" />
                    Adding Book...
                  </>
                ) : (
                  <>
                    <Plus size={20} className="w-5 h-5" />
                    Add Book to Catalog
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={loading}
              >
                <RotateCcw size={20} className="w-5 h-5" />
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export default AddBook;
