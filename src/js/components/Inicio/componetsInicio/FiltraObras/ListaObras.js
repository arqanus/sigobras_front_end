import React, { Component } from 'react';
import axios from 'axios';
import { FaList, FaClock, FaRegImages, FaChartPie, FaUserFriends, FaPrint, FaEye } from "react-icons/fa";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledCollapse, Spinner, Nav, NavItem, TabContent, NavLink, TabPane  } from 'reactstrap';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf'
import 'jspdf-autotable';
import { toast } from "react-toastify";

// import { logoSigobras, logoGRPuno } from '../../Reportes/imgB64'


// import { Progress } from 'react-sweet-progress';
// import "react-sweet-progress/lib/style.css";
import { UrlServer } from '../../../Utils/ServerUrlConfig'
import { Card, CardHeader, CardBody, Collapse} from 'reactstrap';

import Componentes from './Componentes'
// import CronogramaAvance from '../CronogramaAvance';
// import Galeria from '../GaleriaImagenes/Galeria';
// import CtrladminDirecta from '../../Reportes/CtrladminDirecta'

// import PersonalInfo from './PersonalInfo'

class ListaObras extends Component{
    constructor(props){
        super(props)
        this.state = {
            modal: false,
            modalUsuarios: false,
            idObra:'',
            collapse: 66,
            DataComponente:[]
            
        }

        this.Setobra = this.Setobra.bind(this);
        this.tabs = this.tabs.bind(this)     
        this.CollapseCard = this.CollapseCard.bind(this)
    }


    Setobra(idFicha, estado_nombre){

        sessionStorage.setItem("idobra", idFicha);
        sessionStorage.setItem("estadoObra", estado_nombre);

        switch(estado_nombre) {
            case 'Corte':
                setTimeout(()=>{ window.location.href = '/CorteObra'},50);            
            break;
            case 'Actualizacion':
                setTimeout(()=>{ window.location.href = '/ActualizacionObra'},50);            
            break;
            case 'Paralizado':
                setTimeout(()=>{ window.location.href = '/ParalizacionObra'},50);
            break;

            case 'Compatibilidad':
            setTimeout(()=>{ window.location.href = '/CompatibilidadObra'},50);
            break;

            default: 'Ejecucion'
                setTimeout(()=>{ window.location.href = '/MDdiario'},50);
            break;
            
        }
    } 


    tabs(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
            activeTab: tab
            });
        }
    }



    CollapseCard(valor, id_ficha){
        let event = valor
    
        this.setState({ 
            collapse: this.state.collapse === Number(event) ? 66 : Number(event),
            idObra: this.state.idObra === Number(id_ficha) ? -1 : Number(id_ficha) 
        });

        axios.post(`${ UrlServer }/getComponentes`,{
            id_ficha:id_ficha
          })
          .then((res)=>{
            // console.log('DataObraComp', res.data);
            this.setState({
              DataComponente: res.data
            })
          })
          .catch((err)=>
            console.error('error', err)
          )
    }

    render(){
        var { collapse } = this.state

        return(
                       
            this.props.items.length <= 0 ?
            <tbody><tr><td colSpan="6" className="text-center text-warning"><Spinner color="primary" size="sm" /> </td></tr></tbody>:
            this.props.items.map((Obras, IndexObras)=>
            <tbody key={ IndexObras }> 
                <tr >
                    <td>{ IndexObras +1 }</td>
                    <td>{ Obras.g_meta }</td>
                    <td style={{width: '15%'}}>

                        <div style={{
                            width: '100%',
                            height: '20px',
                            textAlign: 'center'
                            }}
                        >

                            <div style={{
                                height: '8px',
                                backgroundColor: '#c3bbbb',
                                borderRadius: '2px',
                                position: 'relative'
                                }}
                            >
                            <div
                                style={{
                                width: `${Obras.porcentaje_avance}%`,
                                height: '100%',
                                backgroundColor: Obras.porcentaje_avance > 95 ? 'rgb(0, 128, 255)'
                                    : Obras.porcentaje_avance > 50 ? 'rgb(99, 173, 247)'
                                    :  'rgb(2, 235, 255)',
                                borderRadius: '2px',
                                transition: 'all .9s ease-in',
                                position: 'absolute',
                                boxShadow: `0 0 6px 1px ${Obras.porcentaje_avance > 95 ? 'rgb(0, 128, 255)'
                                    : Obras.porcentaje_avance > 50 ? 'rgb(99, 173, 247)'
                                    :  'rgb(2, 235, 255)'}`
                                }}
                            /><span style={{ position:'inherit', fontSize:'0.6rem', top: '4px' }}>{Obras.porcentaje_avance} %</span>
                            </div>
                        
                        </div> 

                    </td>
                    <td className="text-center"> 
                        <button className="btn btn-outline-dark btn-sm text-white" onClick={((e) => this.Setobra(  Obras.id_ficha,  Obras.estado_nombre  )) }>{ Obras.codigo } </button> 
                    </td>
                    <td className="text-center"> 
                        <span className={ Obras.estado_nombre === "Ejecucion"? "badge badge-success p-1": Obras.estado_nombre === "Paralizado" ? "badge badge-warning p-1" : Obras.estado_nombre === "Corte"? "badge badge-danger p-1":  Obras.estado_nombre=== "Actualizacion"? "badge badge-primary p-1": "badge badge-info p-1"}>{ Obras.estado_nombre } </span>
                    </td>
                    <td style={{width: '20%'}}  className="text-center">
                        <button className="btn btn-outline-info btn-sm mr-1" title="Avance Componentes" onClick={e=> this.CollapseCard(IndexObras, Obras.id_ficha) } data-event={IndexObras} ><FaList /></button>
                        <button className="btn btn-outline-info btn-sm mr-1" title="Cronograma" ><FaClock /></button>
                        <button className="btn btn-outline-info btn-sm mr-1" title="Galeria de Imagenes" ><FaRegImages /></button>
                        <button className="btn btn-outline-primary btn-sm" title="Personal"><FaUserFriends /></button>
                    </td>
                </tr>
            
                
                <tr>
                
                    <td colSpan="6">
                        {collapse === IndexObras ?
                            <Collapse isOpen={collapse === IndexObras}>
                                <Componentes DataComponente = {this.state.DataComponente  } />
                            </Collapse>
                        :''} 
                    </td>
                
                </tr>
                   
            </tbody>
        )
                
            
        )
        
    }
}
export default ListaObras;