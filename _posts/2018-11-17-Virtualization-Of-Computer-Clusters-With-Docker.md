---
title: "Virtualization of Computer Clusters with Docker"
layout: post
date: 2018-11-17 13:48
image: /assets/images/markdown.jpg
headerImage: false
tag:
  - Virtualization
  - Docker
  - Spark
  - Map Reduce
  - Hadoop
  - Clusters
category: blog
author: arnavgarg
description: Virtualization of Computer Clusters with Docker
---

# Abstract

Often times frameworks used for processing big data are customized for particular uses. Testing new techniques or optimizations in a framework requires the use of several machines running in a multiple node cluster. This can be costly and resource intensive when developing changes to a framework. Local developers may not have the luxury of renting out distributed computing services every time they need to test out local changes they've made to Apache Hadoop or other frameworks. 

In this paper we present Erawan, a system that provides virtualization of a computer cluster on a single machine. Erawan can simulate a distributed computing environment on a developer's personal machine using a series of Docker containers operating on a Docker network as if they were individual virtual machines. This allows them to test big data applications without having to own or rent expensive computer clusters. We show that Erawan can deploy and configure frameworks such as Hadoop on one's local machine. This makes working with distributed computing a much more cheaper and user-friendly experience.

# Introduction

Distributed computing has become an essential part of big data analytics. The ability to handle large amounts of data requires groups of computers also known as clusters to work together on a network processing in parallel. This has lead to the development of different frameworks designed specifically for big data applications. Example of popular frameworks include Apache Hadoop or Apache Spark

The growth of big data has motivated new optimizations and techniques for improving big data applications. This means changes are constantly being made on existing frameworks to provide better performance in things such as throughput, latency, scalability, and fault tolerance.

One big challenge with developing and configuring existing frameworks is the ability to test the new features and functionality in a cost effective way. For testing big data frameworks a developer would normally need to provision several machines to function as a computer cluster to run the framework as a distributed system. This can be an expensive method for testing changes to a framework, especially if changes are incremental or if troubleshooting needs to be performed on existing modifications.

Local installations of a framework currently do not provide a solution. This is because a local installation of Hadoop behaves only like a single node cluster. This does not replicate a distributed computing environment that a normal big data application runs on. Because multiple nodes are needed in a cluster, multiple machines need to be provisioned to simulate a distributed system. 

Our solution makes it possible to have a local setup that still achieves a distributed computing environment. We utilize virtualization on a single machine such that multiple nodes can be running without using multiple physical machines. By using Docker containers, we can deploy virtual machines each running a framework such as Hadoop while operating on the same network as would a computer cluster. These Docker containers can be interfaced with by a developer as if they had access to multiple machines but without having to actually provision physical machines with their framework modifications. A developer could then construct changes to Hadoop and deploy it on these Docker containers to test it on a distributed environment. 

The outline of our paper is as follows. We describe in detail our implementation of a virtualized computer cluster using Docker in Section 2. Evaluation of our implementation is explained in Section 3.

# Implementation

In this section we describe the components used in implementing our system. We built our system to allow deployments and configurations of Apache Hadoop and Apache Spark. Our code can be found in: [Github Repo](https://github.com/thearnavgarg/docker-cluster)

## Docker

Docker is a program that allows virtualization at the operating system level. Known as containerization, this method allows you to generate virtual machines that are self-contained without needing additional configurations and dependencies in the host machine. 

The way Docker generates containers is through a Docker image. The Docker image contains the configurations and settings for a single machine with operating system level components. Instances of the image are generated as containers. Several containers can be running the same image configuration. An example image might contain a Ubuntu installation with OpenJDK 8. Docker allows you to generate several containers with this one single image. Each container functions independently as its own system (e.g. each running its own Ubuntu and its own OpenJDK 8) despite using a shared image. 

A Docker image is constructed from a Dockerfile that is written by the user. The Dockerfile specifies all the components that the image will be made up of. A Dockerfile comes with its own syntax for processing commands. Examples include specifying the environment of the Docker image with ENV and running commands during image constructing with RUN. Our Dockerfile will contain at the very least some of the environment settings and file installations needed to get Hadoop running on a Ubuntu operating system. 

```
  FROM ubuntu:16.04
    # set environment vars
    ENV HADOOP_HOME /opt/hadoop
    ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

    # install basics
    RUN apt-get update \
    && apt-get install -y wget \
    && rm -rf /var/lib/apt/lists/*

    # install packages
    RUN \
                apt-get update && apt-get install -y \
                ssh \
                rsync \
                vim \
                openjdk-8-jdk \
                openssh-server

    # download and extract hadoop, set JAVA_HOME in hadoop-env.sh, update path

    RUN \
        wget http://apache.mirrors.tds.net/hadoop.gz && \
        tar -xzf hadoop-2.8.5.tar.gz && \
        mv hadoop-2.8.5 $HADOOP_HOME && \
        echo "export JAVA_HOME=$JAVA_HOME" >> $HADOOP_HOME/etc/hadoop/hadoop-env.sh && \
        echo "PATH=$PATH:$HADOOP_HOME/bin" >> ~/.bashrc
    ...
    # additional steps here
```

We use Docker images as a basis for the different nodes in our virtualized computer cluster. While we only use one Docker image, we reuse that image for generating different containers. Each container will contain Hadoop on it so that it can run part of the distributed environment\citep{dockernetwork}. Essentially each container is an instantiation of our Docker image and functions as one node in the cluster. Our Docker image will contain all the components necessary for configuring a single node. We deploy instances of the image as Docker containers setup under one cluster.

<!-- ![How Docker Works](/assets/images/docker_diagram.png) -->
<p align="center">
<img src="/assets/images/docker_diagram.png" id="fig:dockeroverview" alt="" /><br /><figcaption>Fig 1: How Docker Works<span label="fig:dockeroverview"></span></figcaption>
</p>


Another component of Docker that we will be using is the Docker network. Not only does the Docker image need to be deployed as several containers running our Hadoop framework but also these containers need to communicate with each other as if they were on the same network. Docker provides networking capabilities between containers for these situations. We can setup a Docker network that allows communication between the containers. In this way we can treat the containers as if they are nodes running on the same cluster. 


## Docker Network

One of the key components to making the individual Docker containers run as a single virtualized cluster is the Docker network that they run on. In order to properly simulate a computer cluster, the Docker containers need to be able to communicate with each other as if they were on the same distributed system. An issue we have to address to avoid having the Docker containers act as independent single node computer clusters. This can be done using a Docker network. 

Consider the example for a computer cluster running Hadoop. Machine A might represent the NameNode with the master configuration. Machines B and C might represent DataNodes with slave configurations. Each machine is configured in Hadoop with their respective properties. B and C both communicate with A as the master node configuration. These machines process and run Hadoop while obeying their host network and master slave relationship.

```
 docker run -d --net myNetwork --ip 172.18.1.1 --hostname node1 --add-host node2:172.18.1.2 --add-host node3:172.18.1.3 --name node1 -it base_image
```
 
We can achieve a similar cluster behavior with our Docker containers as long as we connect the containers across an established Docker network. Figure 1 shows an example of how a docker network is setup. Since we treat each container as its own node, we simply have to add them onto one single network with an assigned IP address. Then we can individually configure each container as a respective master or slave node such that they can utilize the network as if it were one computing cluster. 

## Hadoop Setup

Creating a Docker image for our virtualized cluster requires creating an image that can support deployment of a multi-node system. Our Dockerfile should specify both the framework requirements for Hadoop and also the dependencies to enable the container to run in a cluster environment with other Hadoop configured containers. 

One example of Docker image requirements is writing a Dockerfile that enables networking across a Hadoop cluster. In order to do this ssh needs to be setup correctly for each instance of the Docker image. Subsequently, this means having ssh and its respective dependencies installed and setup on the Docker image before creating the Docker network. 

The general approach to constructing the Dockerfile is to write down the commands or steps needed for installing Hadoop on a single machine. This means that the normal procedures for installing Hadoop locally can be executed within the Dockerfile. In a later step the Docker containers will be configured to exist on the same Docker network as a virtualized computer cluster.

For a local installation of Hadoop designed for a single node cluster, configuration files are needed for setup. This includes several XML files that compose the basis for any Hadoop environment. These XML files govern the behavior of the framework in things such as the HDFS, YARN, and MapReduce components. Our Dockerfile similarly has to utilize these configuration files for installation. 

For each of the various services that Hadoop supports, additional configuration XML files would be needed. That's why our system will take user input and generate the appropriate base image needed for each type of setup. Consider the example of having Spark and HDFS running with Apache Hadoop. Our system will construct in addition to the default base image the dependencies and configurations needed to run HDFS and Spark together. The goal is to have customized Docker images for the appropriate type of Hadoop setup needed by the user. Regardless of the type of Docker image we generate, it could then be deployed in our virtualized cluster in a modular fashion.

## Deploying Hadoop

Since there are different frameworks and services that use Hadoop, a user may want different configurations for their need. Our system allows for a user specification for how Hadoop should be deployed. We use a JSON configuration file that a user can customize for building their computing cluster. This allows them to have has minimal or as complex of a Hadoop setup for their use case.

```
{
  "cluster": {
    "num_nodes": "3"
  },
  "image":{
    "framework": {
      "name": "hadoop",
      "computation": {
        "name": "spark"
      },
      "resource_manager": {
        "name": "yarn"
      }
    }
  }
}
```

The configuration file specifies things such as the number of nodes in the cluster, the type of framework, and the type of resource manager to use. We can expect to further add to this configuration file for different combinations of frameworks as needed. The configuration file as of now is meant to deploy Hadoop related services, but in theory could be extended to other big data applications. 

Our system is initiated by a Python script that reads in the configuration file before constructing the containers from Docker images. As part of deployment, the Dockerfiles we use are modified as needed to maintain the dependencies. An example of this is ensuring Spark and YARN run with Hadoop, meaning our Docker image has all these installed properly before we deploy as a container. 

As building an image every time the user wants to run a cluster would be a time consuming task, we further improve the efficiency of our application by first checking if the image already exists in the users host machine. This is done by hashing the value of the image key in the user defined configuration file and using that hash value as the name of the image. This would allow us to create new image only when the image configuration is changed.

## Evaluation

To evaluate this work we created a n1-standard-8 gce machine. This has 8 vCPUs and 30 GB memory. Using this we created a n-node hadoop setup and evaluated our work using wordcount and pi from hadoop-mapreduce-examples-3.1.0.jar and TestDFSIO job from hadoop-mapreduce-client-jobclient-*-tests.jar. 

We noticed that as we increased the number of containers the performance was constant. In particular running the pi job with 32 maps and 1000000 samples per map the job took 70-75 seconds for 2-20 containers. After that performance started linearly decreasing.

One speculation is that, as the docker containers share all the CPU's in the system, a 2-node containerized cluster and a 20-node containerized cluster would utilize the same CPU power. As we increase the number of nodes after that the docker process also needs more memory so total memory given to hadoop starts deacreasin. As part of future work we will be doing more evaluation on this work and also adding support to limit the CPU and memory power per container.

## Future Work

Our work on a virtualized computer cluster can be further extended for different frameworks. While we focused on Hadoop, many different services and big data analytic frameworks can be implemented as Docker images. As long as the Dockerfile is written properly with all associated dependencies, we can easily virtualize any distributed computing system so that a local machine can run and test a computer cluster with multiple nodes.

Additional features that would be nice to have is automated testing infrastructure for the system. While each service within a framework might have separate entities that needed to be tested, we can design a simulation for running a computer cluster under various conditions. Examples include node failures or high load issues to test the fault tolerance of a framework. Some sort of regression framework for developing new features would also be beneficial whenever the system was deployed for testing.

We would also like to support more configurable options in our user-defined configuration file, allowing the clusters to be highly configurable and support variety of combinations of different frameworks.

While our system is based on a CLI interface, we would like to have a more robust interface to have a better coherent interaction with the overall virtualized system. This could be in the form of a GUI that provides live data on the entire cluster and allows for customizations on the fly for different nodes. Node management and live statistics are important elements that are made possible by a virtualized cluster and are more readily accessible in a better user interface.

## Conclusion


In this paper we discuss a cost effective way for developing distributed frameworks without requiring the deployment of multiple physical machines. We describe the implementation of a virtualized computing cluster that provides a demonstration of a distributed system using only a single physical machine. We show that this can be done using existing virtualized mechanisms such as Docker, which provides a means for containerizing operating system level functionality 

We show how we can develop Docker images that can behave as individual nodes of a computing cluster. We provide implementation details on Docker image configurations for deployment. We also describe how these images rely on Hadoop installation dependencies to work, as well as how the containers can exist on a single network. These components put together make a realistic version of a computing cluster operating on a single machine. 

