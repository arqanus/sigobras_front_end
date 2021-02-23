import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Spinner,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
  Nav,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col,
  FormGroup,
  Label,
} from "reactstrap";
import { FaUpload, FaMediumM } from "react-icons/fa";
import axios from "axios";

import { UrlServer } from "../Utils/ServerUrlConfig";
import { Redondea, mesesShort } from "../Utils/Funciones";
export default ({ recargar, data }) => {
  const [modal, setModal] = useState(false);
  const toggle = () => {
    if (!modal) {
      if (data) {
        setFormularioData(data);
      } else {
        setFormularioData({
          fichas_id_ficha: sessionStorage.getItem("idobra"),
          resolucion: "",
        });
      }
    }
    setModal(!modal);
  };
  //formulario
  const [FormularioData, setFormularioData] = useState({
    fichas_id_ficha: sessionStorage.getItem("idobra"),
    resolucion: "",
  });
  const handleInputChange = (event) => {
    if (event.target.name == "archivo") {
      setFormularioData({
        ...FormularioData,
        [event.target.name]: event.target.files[0],
      });
    } else {
      setFormularioData({
        ...FormularioData,
        [event.target.name]: event.target.value,
      });
    }
  };
  async function guardarFormularioData(event) {
    event.preventDefault();
    try {
      console.log("data ", FormularioData);
      const formData = new FormData();
      formData.append("fichas_id_ficha", FormularioData.fichas_id_ficha);
      formData.append("resolucion", FormularioData.resolucion);
      formData.append("nombre", FormularioData.nombre);
      formData.append("fecha", FormularioData.fecha);
      formData.append("codigo", sessionStorage.getItem("codigoObra"));
      formData.append("archivo", FormularioData.archivo);
      const config = {
        headers: {
          "content-type": "multipart/form-data",
        },
      };
      if (data) {
        var res = await axios.put(
          `${UrlServer}/v1/presupuestosAprobados/${FormularioData.id}`,
          formData,
          config
        );
      } else {
        var res = await axios.post(
          `${UrlServer}/v1/presupuestosAprobados`,
          formData,
          config
        );
      }

      recargar();
      setModal(false);
      alert(res.data.message);
    } catch (error) {
      alert("Ocurrio un error");
    }
  }
  const [ShowArchivoForm, setShowArchivoForm] = useState(false);
  return (
    <div>
      {data ? (
        <FaUpload onClick={toggle} />
      ) : (
        <Button color="danger" onClick={toggle}>
          +
        </Button>
      )}

      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          Ingresar Nuevo Presupuesto Aprobado
        </ModalHeader>
        <form onSubmit={guardarFormularioData}>
          <ModalBody>
            <Row>
              <Col md={7}>
                <FormGroup>
                  <Label>nombre</Label>
                  <Input
                    value={FormularioData.nombre}
                    type="text"
                    onChange={handleInputChange}
                    name="nombre"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={5}>
                <FormGroup>
                  <Label>fecha</Label>
                  <Input
                    value={FormularioData.fecha}
                    type="date"
                    onChange={handleInputChange}
                    name="fecha"
                    required
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Button onClick={() => setShowArchivoForm(!ShowArchivoForm)}>
                  Agregar archivo
                </Button>
              </Col>
            </Row>
            {ShowArchivoForm && (
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>Resolucion</Label>
                    <Input
                      value={FormularioData.resolucion}
                      type="text"
                      onChange={handleInputChange}
                      name="resolucion"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
            )}
            {ShowArchivoForm && (
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label>ARCHIVO</Label>
                    <Input
                      type="file"
                      onChange={handleInputChange}
                      name="archivo"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary">{data ? "ACTUALIZAR" : "GUARDAR"}</Button>{" "}
            <Button color="secondary" onClick={toggle}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
};
