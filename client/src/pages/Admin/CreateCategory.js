import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal, Spin, Button, Table, Space, Card, Tag, Input } from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import "../../styles/CreateCategory.css";

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Handle Form Submission
  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:8080/api/v1/category/create-category",
        { name }
      );
      if (data?.success) {
        toast.success(`${name} category created successfully`);
        setName("");
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Get all categories
  const getAllCategory = async () => {
    setTableLoading(true);
    try {
      const { data } = await axios.get(
        "http://localhost:8080/api/v1/category/get-category",
        {
          headers: {
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        }
      );
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load categories");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Update category
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put(
        `http://localhost:8080/api/v1/category/update-category/${selected._id}`,
        { name: updatedName }
      );
      if (data.success) {
        toast.success(`${updatedName} category updated successfully`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (pId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }
    
    setTableLoading(true);
    try {
      const { data } = await axios.delete(
        `http://localhost:8080/api/v1/category/delete-category/${pId}`
      );
      if (data.success) {
        toast.success(`"${categoryName}" category has been deleted`);
        getAllCategory();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setTableLoading(false);
    }
  };

  // Filter categories based on search text
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="category-name">{text}</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green" className="status-tag">Active</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="default" 
            icon={<EditOutlined />}
            onClick={() => {
              setVisible(true);
              setUpdatedName(record.name);
              setSelected(record);
            }}
            className="edit-btn"
          >
            Edit
          </Button>
          <Button 
            type="default" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id, record.name)}
            className="delete-btn"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout title={"Dashboard - Category Management"}>
      <div className="container-fluid m-3 p-3 dashboard-container">
        <div className="row">
          <div className="col-md-3 admin-sidebar">
            <AdminMenu />
          </div>
          <div className="col-md-9 admin-main-content">
            <div className="page-header">
              <h1>Category Management</h1>
              <div className="header-actions">
                <Input
                  placeholder="Search categories..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input"
                />
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={getAllCategory}
                  loading={tableLoading}
                  className="refresh-btn"
                >
                  Refresh
                </Button>
              </div>
            </div>
            
            <Card 
              title="Add New Category" 
              className="form-card"
            >
              <Spin spinning={loading}>
                <CategoryForm
                  handleSubmit={handleSubmit}
                  value={name}
                  setValue={setName}
                  placeholder="Enter category name"
                  buttonText="Create Category"
                  buttonIcon={<PlusOutlined />}
                />
              </Spin>
            </Card>
            
            <Card 
              title={`Categories (${filteredCategories.length})`}
              className="table-card"
            >
              <Spin spinning={tableLoading}>
                <Table 
                  columns={columns} 
                  dataSource={filteredCategories} 
                  rowKey="_id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} categories`
                  }}
                  locale={{
                    emptyText: categories.length === 0 ? 'No categories found' : 'No matching categories'
                  }}
                />
              </Spin>
            </Card>
            
            <Modal
              title="Edit Category"
              onCancel={() => setVisible(false)}
              footer={null}
              visible={visible}
              className="edit-modal"
            >
              <CategoryForm
                value={updatedName}
                setValue={setUpdatedName}
                handleSubmit={handleUpdate}
                placeholder="Edit category name"
                buttonText="Update Category"
                buttonIcon={<EditOutlined />}
              />
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;