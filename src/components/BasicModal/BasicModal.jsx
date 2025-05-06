import React from "react";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import ModalHeader from "react-bootstrap/ModalHeader";

function BasicModal(props) {
  // Desestructuramos las props, definiendo valores por defecto
  const {
    show,
    setShow,
    title = "Título predeterminado",
    children,
    size = "lg",
    headerStyle = {
      backgroundColor: "#2c3e50",
      color: "#fff",
      padding: "1rem",
    },
    titleStyle = {},
    closeIconStyle = {
      cursor: "pointer",
      marginLeft: "auto",
      fontSize: "1.5rem",
    },
    bodyStyle = {},
  } = props;

  return (
    <Modal
      show={show}
      onHide={() => setShow(false)}
      centered
      backdrop="static"
      keyboard={false}
      size={size}
    >
      <ModalHeader style={headerStyle}>
        <Modal.Title style={titleStyle}>{title}</Modal.Title>
        <FontAwesomeIcon
          title="Cerrar ventana"
          icon={faTimesCircle}
          onClick={() => setShow(false)}
          style={closeIconStyle}
        />
      </ModalHeader>
      <Modal.Body style={bodyStyle}>{children}</Modal.Body>
    </Modal>
  );
}

export default BasicModal;
