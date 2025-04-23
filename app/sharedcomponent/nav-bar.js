"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // استيراد useRouter
import { Navbar, Nav, Container, Button, Badge, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaSearchPlus, FaSearchMinus } from "react-icons/fa"; // استيراد أيقونات زيادة ونقصان الزوم
import ClientZoomEffect from "./ClientZoomEffect"; // استيراد مكون الزوم



const NavBar = () => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(70); // قيمة الزوم الافتراضية
  const [expandedIndex, setExpandedIndex] = useState(null);
  const router = useRouter(); // استخدام useRouter

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalItems = storedCart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
        setCartItems(storedCart);
      } catch (error) {
        console.error("Error updating cart count from localStorage:", error);
        setCartCount(0);
        setCartItems([]);
      }
    };

    updateCartCount();
    const interval = setInterval(updateCartCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // دالة للتنقل
  const handleNavigation = (path) => {
    setTimeout(() => {
      setShowCart(false); // إغلاق السلة بعد عدد من الثواني
      router.push(path); // التنقل باستخدام router.push
    }, 5000); // 2000 
  };
  

   // دالة لزيادة الزوم
   const increaseZoom = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 10, 200)); // لا يزيد عن 200%
  };

  // دالة لتقليل الزوم
  const decreaseZoom = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 10, 20)); // لا يقل عن 20%
  };

  // دالة لزيادة الكمية
  const increaseQuantity = (id, e) => {
    e.stopPropagation();
    const updatedCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  // دالة لنقص الكمية
  const decreaseQuantity = (id, e) => {
    e.stopPropagation();
    const updatedCart = cartItems.map((item) =>
      item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  // دالة لحذف عنصر معين
  const removeItem = (id, e) => {
    e.stopPropagation();
    const updatedCart = cartItems.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  // دالة لحذف كل العناصر
  const removeAllItems = (e) => {
    e.stopPropagation();
    localStorage.setItem("cart", JSON.stringify([]));
    setCartItems([]);
    setCartCount(0);
  };

  // حساب الإجمالي
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>

    <ClientZoomEffect zoomLevel={zoomLevel} /> {/* هنا قمنا بتمرير قيمة الزوم */}

    <Navbar expand="lg" bg="light" variant="light" className="shadow-sm sticky-top" style={{ backgroundColor: "#f8f9fa" }}>
    <Navbar.Brand
  onClick={() => handleNavigation("/")}
  style={{
    color: "#1a3c34",
    fontWeight: "bold",
    paddingLeft: "35px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "color 0.3s ease",
  }}
>
  
  {/* Paws Trip */}

  <img
    src="/logo.png"
    alt="Logo"
    width="100"
    height="20"
    style={{ marginRight: "10px", borderRadius: "50%", padding: "2px",}}
  />
</Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mx-auto">
          {["/", "/products", "/offers", "/contact"].map((path, idx) => (
            <Nav.Link
              key={idx}
              onClick={() => handleNavigation(path)} // استبدال as={Link} بـ onClick
              style={{
                color: "#1a3c34",
                margin: "0 10px",
                transition: "color 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#16a085")}
              onMouseLeave={(e) => (e.target.style.color = "#1a3c34")}
            >
              {["Home", "Products", "Orders"][idx]}
            </Nav.Link>
          ))}
        </Nav>



         


        {/* Cart Dropdown */}
        <Dropdown show={showCart} onToggle={(isOpen) => setShowCart(isOpen)} align="end"  autoClose="outside" >
          <Dropdown.Toggle
            as={Button}
            variant="outline-dark"
            className="position-relative"
            onClick={() => setShowCart(!showCart)}
            style={{
              borderColor: "#16a085",
              color: "#16a085",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#16a085";
              e.target.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#16a085";
            }}
          >
            🛒 Cart
            {cartCount > 0 && (
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle rounded-circle"
                style={{ fontSize: "0.7rem", padding: "0.3em 0.5em", backgroundColor: "#e74c3c" }}
              >
                {cartCount}
              </Badge>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu
            style={{
              minWidth: "400px",
              maxHeight: "500px",
              overflowY: "auto",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              backgroundColor: "#ffffff",
              border: "1px solid #ecf0f1",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {cartItems.length > 0 ? (
              <>
                {cartItems.map((item, index) => (
                  <Dropdown.Item
                    key={index}
                    as="div"
                    onClick={(e) => e.stopPropagation()}
                    className="d-flex align-items-center mb-3 p-3"
                    style={{
                      borderBottom: index < cartItems.length - 1 ? "1px solid #ecf0f1" : "none",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f6f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginRight: "20px",
                        border: "1px solid #ddd",
                      }}
                    />

...



<div style={{ flex: 1 }}>
  <div
    onClick={(e) => {
      e.stopPropagation();
      setExpandedIndex(expandedIndex === index ? null : index);
    }}
    style={{
      fontWeight: "bold",
      fontSize: "1.1rem",
      color: "#1a3c34",
      cursor: "pointer",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: expandedIndex === index ? "normal" : "nowrap",
      maxWidth: "250px",
      transition: "all 0.3s ease",
      maxHeight: expandedIndex === index ? "100px" : "1.2em", // ✅ هنا المفتاح
      overflowY: expandedIndex === index ? "auto" : "hidden",
    }}
    title={item.title}
  >
    {item.title}
  </div>




                      <div style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                        Color: <span style={{ textTransform: "capitalize" }}>{item.color}</span>
                      </div>


                      <div className="d-flex align-items-center mt-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={(e) => decreaseQuantity(item.id, e)}
                          style={{
                            padding: "2px 10px",
                            borderColor: "#bdc3c7",
                            color: "#1a3c34",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#bdc3c7";
                            e.target.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#1a3c34";
                          }}
                        >
                          -
                        </Button>
                        <span style={{ margin: "0 12px", color: "#1a3c34", fontWeight: "500" }}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={(e) => increaseQuantity(item.id, e)}
                          style={{
                            padding: "2px 10px",
                            borderColor: "#bdc3c7",
                            color: "#1a3c34",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#bdc3c7";
                            e.target.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#1a3c34";
                          }}
                        >
                          +
                        </Button>
                      </div>
                      <div style={{ fontSize: "1rem", color: "#e74c3c", marginTop: "8px" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Remove this item</Tooltip>}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        style={{
                          marginLeft: "15px",
                          borderColor: "#e74c3c",
                          color: "#e74c3c",
                          transition: "all 0.3s ease",
                        }}
                        onClick={(e) => removeItem(item.id, e)}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#e74c3c";
                          e.target.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#e74c3c";
                        }}
                      >
                        ✕
                      </Button>
                    </OverlayTrigger>
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider style={{ borderColor: "#ecf0f1", margin: "10px 0" }} />
                <Dropdown.Item as="div" className="p-2">
                  <div className="d-flex justify-content-between mb-3">
                    <span style={{ fontWeight: "bold", color: "#1a3c34", fontSize: "1.1rem" }}>
                      Total:
                    </span>
                    <span style={{ fontWeight: "bold", color: "#e74c3c", fontSize: "1.1rem" }}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Clear your cart</Tooltip>}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => removeAllItems(e)}
                        style={{
                          borderColor: "#e74c3c",
                          color: "#e74c3c",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#e74c3c";
                          e.target.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                          e.target.style.color = "#e74c3c";
                        }}
                      >
                        Remove All
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Complete your purchase</Tooltip>}>
                      <Button
                        onClick={() => handleNavigation("/checkout")} // تعديل هنا كمان
                        variant="success"
                        size="sm"
                        style={{
                          backgroundColor: "#16a085",
                          borderColor: "#16a085",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = "#138d75")}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a085")}
                      >
                        Proceed to Checkout
                      </Button>
                    </OverlayTrigger>
                  </div>
                </Dropdown.Item>
              </>
            ) : (
              <Dropdown.Item as="div" className="text-center p-4">
                <span style={{ color: "#7f8c8d", fontSize: "1rem" }}>Your cart is empty</span>
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>


       {/* Zoom Controls */}
        <div className="d-flex align-items-center ms-3 ">
            <Button
              variant="outline-dark"
              onClick={decreaseZoom}
              style={{
                borderColor: "#16a085",
                color: "#16a085",
                marginRight: "10px",
                transition: "all 0.3s ease",
              }}
            >
              
              <FaSearchMinus />
            </Button>
            <span style={{ color: "#1a3c34", fontWeight: "bold" }}> {zoomLevel}%</span>
            <Button
              variant="outline-dark"
              onClick={increaseZoom}
              style={{
                borderColor: "#16a085",
                color: "#16a085",
                transition: "all 0.3s ease",
              }}
            >
              
              <FaSearchPlus />
            </Button>
          </div>
       
          
      </Navbar.Collapse>
    </Navbar>
    </>
  );
};

export default NavBar;
