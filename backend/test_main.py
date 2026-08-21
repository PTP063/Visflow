import pytest
from main import (
    find_cycle_nodes,
    find_cycle_nodes_and_order,
    count_connected_components,
    app,
)
from fastapi.testclient import TestClient

client = TestClient(app)


def is_dag(node_ids, edges):
    """Test convenience wrapper mirroring the response contract."""
    return len(find_cycle_nodes(node_ids, edges)) == 0


def test_empty_pipeline_is_dag():
    assert is_dag([], []) is True


def test_isolated_nodes_no_edges():
    assert is_dag(['a', 'b', 'c'], []) is True


def test_simple_chain_is_dag():
    edges = [{'source': 'a', 'target': 'b'}, {'source': 'b', 'target': 'c'}]
    assert is_dag(['a', 'b', 'c'], edges) is True
    stuck, order = find_cycle_nodes_and_order(['a', 'b', 'c'], edges)
    assert stuck == []
    assert order == ['a', 'b', 'c']


def test_simple_cycle_is_not_dag():
    edges = [
        {'source': 'a', 'target': 'b'},
        {'source': 'b', 'target': 'c'},
        {'source': 'c', 'target': 'a'},
    ]
    assert is_dag(['a', 'b', 'c'], edges) is False
    stuck, order = find_cycle_nodes_and_order(['a', 'b', 'c'], edges)
    assert len(stuck) == 3
    assert order == []


def test_cycle_nodes_reports_only_the_cyclic_nodes():
    # a -> b -> c -> b is a cycle on {b, c}; 'a' feeds in but isn't part of it
    edges = [
        {'source': 'a', 'target': 'b'},
        {'source': 'b', 'target': 'c'},
        {'source': 'c', 'target': 'b'},
    ]
    assert sorted(find_cycle_nodes(['a', 'b', 'c'], edges)) == ['b', 'c']


def test_self_loop_is_not_dag():
    edges = [{'source': 'a', 'target': 'a'}]
    assert is_dag(['a'], edges) is False


def test_diamond_shape_is_dag():
    # a -> b -> d, a -> c -> d  (shared descendant, no cycle)
    edges = [
        {'source': 'a', 'target': 'b'},
        {'source': 'a', 'target': 'c'},
        {'source': 'b', 'target': 'd'},
        {'source': 'c', 'target': 'd'},
    ]
    assert is_dag(['a', 'b', 'c', 'd'], edges) is True
    stuck, order = find_cycle_nodes_and_order(['a', 'b', 'c', 'd'], edges)
    assert stuck == []
    assert order[0] == 'a'
    assert order[-1] == 'd'


def test_disconnected_subgraphs_both_acyclic_is_dag():
    # {a -> b} and {c -> d} are unrelated components, both acyclic
    edges = [{'source': 'a', 'target': 'b'}, {'source': 'c', 'target': 'd'}]
    assert is_dag(['a', 'b', 'c', 'd'], edges) is True
    assert count_connected_components(['a', 'b', 'c', 'd'], edges) == 2


def test_disconnected_subgraphs_one_cyclic_is_not_dag():
    # {a -> b} is fine, {c -> d -> c} is a cycle in an unrelated component
    edges = [
        {'source': 'a', 'target': 'b'},
        {'source': 'c', 'target': 'd'},
        {'source': 'd', 'target': 'c'},
    ]
    assert is_dag(['a', 'b', 'c', 'd'], edges) is False


def test_edge_referencing_unknown_node_is_ignored():
    edges = [{'source': 'a', 'target': 'ghost'}]
    assert is_dag(['a'], edges) is True


def test_health_endpoint():
    res = client.get('/health')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'healthy'
    assert 'version' in data


def test_parse_pipeline_endpoint():
    payload = {
        'nodes': [{'id': 'n1'}, {'id': 'n2'}, {'id': 'n3'}],
        'edges': [{'source': 'n1', 'target': 'n2'}, {'source': 'n2', 'target': 'n3'}],
    }
    res = client.post('/pipelines/parse', json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data['num_nodes'] == 3
    assert data['num_edges'] == 2
    assert data['is_dag'] is True
    assert data['topological_order'] == ['n1', 'n2', 'n3']
    assert data['num_components'] == 1

