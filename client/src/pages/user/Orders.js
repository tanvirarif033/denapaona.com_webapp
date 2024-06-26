import React from "react";
import Layout from "./../../components/Layout/Layout";
import UsersMenu from "../../components/Layout/UsersMenu";

const Orders = () => {
  return (
    <Layout title={"Your Order"}>
      <div className="container-flui p-3 m-3">
        <div className="row">
          <div className="col-md-3">
            <UsersMenu />
          </div>
          <div className="col-md-9">
            <h1>All Orders</h1>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
